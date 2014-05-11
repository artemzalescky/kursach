/* Базовый класс контроллера, ничего не реализует, просто декларирует методы */
function BaseController () {
    var self = {};

    self.mouseDown = function (point) {};
    self.mouseMove = function (point) {};
    self.mouseUp = function (point) {};
    self.keyPressed = function () {};
    self.reset = function () {};
    self.getPoints = function () {return []};

    return self;
}


/* Базовый класс контроллера управляющий созданием объектов.

 Все контроллеры, которые от него наследуются реализуют методы mouseDown и mouseUp,
 благодаря чему можно легко реализовывать разные способы создания объектов.

 objectBuilder - объект, который будет вызываться для создания объектов (строитель объектов). */
function ObjectCreationController (objectBuilder) {
    var self = BaseController();

    // PROTECTED поля

    self._objectBuilder = objectBuilder;    // экземпляр строителя объектов
    self._objectConstructionPoints = [];    // сюда добавляются точки которые потом будут использоваться для создания объекта

    /* запустить создание объекта, вызывается классами-наследниками */
    self._startObjectCreation = function () {
        var fixDef = new b2FixtureDef;
        fixDef.density = parseFloat($('#object_density').val());                // плотность
        fixDef.friction = parseFloat($('#object_friction').val());                // коэфициент трения
        fixDef.restitution = parseFloat($('#object_restitution').val());        // коэффицент упругости
        fixDef.isSensor = !($('#object_is_sensor').is(":checked"));             // если isSensor == False, тело твердое

        var bodyDef = new b2BodyDef;
        bodyDef.type = BODY_TYPES[$('#object_body_type').val()];                // тип тела (static, dynamic, kinematic)
        bodyDef.active = worldActivated;

        // вызываем строитель объектов
        self._objectBuilder.build(self._objectConstructionPoints, fixDef, bodyDef);

        self.reset();
        objectCreated();
    }

    // PUBLIC поля

    self.keyPressed = function () {
        if (keyController.isActive(KEY_COMBINATIONS.BREAK)) {
            self.reset();
        }
    }

    /* сбросить точки */
    self.reset = function () {
        self._objectConstructionPoints = [];
    }

    self.getPoints = function (point) {
        return self._objectConstructionPoints;
    }

    return self;
}

/* Класс контроллера создания объектов по двум точкам.
 Для создания объекта нужно нажать, потянуть и отпустить мышку. */
function DragCreationController(objectBuilder) {
    var self = ObjectCreationController(objectBuilder);

    self.mouseDown = function (point) {
        self._objectConstructionPoints.push(point);
        self._objectConstructionPoints.push(point);
    }

    self.mouseMove = function (point) {
        self._objectConstructionPoints[1] = point;
    }

    self.mouseUp = function (point) {
        self._startObjectCreation();
    }

    return self;
}

/* Класс контроллера создания объектов по любому числу точек. */
function VariableClicksCreationController(objectBuilder, minPointsNumber) {
    var self = ObjectCreationController(objectBuilder);

    if (minPointsNumber === undefined) {
        minPointsNumber = 1;
    }

    self.mouseUp = function (point) {
        self._objectConstructionPoints.push(point);
    }

    var superKeyPressed = self.keyPressed;
    self.keyPressed = function () {
        if (keyController.isActive(KEY_COMBINATIONS.FINISH) &&
            self._objectConstructionPoints.length >= minPointsNumber)
        {
            self._startObjectCreation();
        } else {
            superKeyPressed();
        }
    }

    return self;
}

/* Класс контроллера создания объектов по фиксированному числу точек. */
function FixedClicksCreationController(objectBuilder, pointsNumber) {
    var self = ObjectCreationController(objectBuilder);

    self.mouseUp = function (point) {
        self._objectConstructionPoints.push(point);
        if (self._objectConstructionPoints.length == pointsNumber) {
            self._startObjectCreation();
        }
    }

    return self;
}

// контроллер выделения фигур
function SelectionController () {
    var self = BaseController();

    var holding = false;        // зажата ли клавиша сохранения выделенных объектов

    var selectionPoints = [];
    var selectedArea = new b2AABB(); // выделенная область

    self.selectedBodies = []; // список выделенных фигур
    self.selectedJoints = [];

    // устанавливает стартовую точку (координаты x, y - в пикселях)
    self.mouseDown = function (point) {
        selectionPoints = [point, point];
    }

    self.mouseMove = function (point) {
        selectionPoints[1] = point;
    }

    self.mouseUp = function (point) {
        if (!keyController.isActive(KEY_COMBINATIONS.HOLD_SELECTION)) {
            self.clearSelection();
        }

        selectionPoints = correctedPoints(selectionPoints);
        selectedArea.lowerBound.Set(selectionPoints[0].x, selectionPoints[0].y);
        selectedArea.upperBound.Set(selectionPoints[1].x, selectionPoints[1].y);

        function getBodyCallback(fixture) {  //возвращает список всех выделенных объектов
            var shapesAabb = fixture.GetAABB();
            var inside = shapesAabb.TestOverlap(selectedArea);
            if (inside) {
                var body = fixture.GetBody();
                self.addBodyToSelected(body);
            }
            return true;
        }

        var activeBodies = activateAllBodies();
        world.QueryAABB(getBodyCallback, selectedArea);
        deactivateAllBodies(activeBodies);
        self.reset();

        if (self.selectedBodies.length === 1) {
            propertiesObject(self.selectedBodies[0]);
        }
        else {            
            propertiesObject(null);
        }
    }

    var superKeyPressed = self.keyPressed;
    self.keyPressed = function () {
        if (keyController.isActive(KEY_COMBINATIONS.DELETE)) {
            deleteObjects(self.selectedBodies);
            deleteJoints(self.selectedJoints);
            self.reset();
        } else if (keyController.isActive(KEY_COMBINATIONS.SELECT_ALL)) {
            var body = world.GetBodyList();
            while (body) {
                self.addBodyToSelected(body);
                body = body.GetNext();
            }
        } else {
            superKeyPressed();
        }
    }

    self.reset = function () {
        painter.reset();
        selectionPoints = [];
    }

    self.removeJointFromJointsList = function(jointIndex) {
        // TODO: remove from list of selected joints
    }

    self.removeJointFromSelected = function(jointIndex) {
        self.selectedJoints.splice(jointIndex, 1);
        self.removeJointFromJointsList(jointIndex);
    }

    self.clearSelection = function () {
        for (var i = 0; i < self.selectedBodies.length; ++i) {
            self.selectedBodies[i].userData.setSelected(false);
        }
        self.selectedBodies = [];

        for (var i = 0; i < self.selectedJoints.length; ++i) {
            self.removeJointFromSelected(self.selectedJoints[i]);
        }
    }

    self.getPoints = function () {
        return selectionPoints;
    }

    self.addJointToJointsList = function(joint) {

    }

    self.addJointToSelected = function(joint) {
        self.selectedJoints.push(joint);
        self.addJointToJointsList(joint);
    }

    // add body to selected bodies and all attached joint to selected joints
    self.addBodyToSelected = function (body) {
        if (!itemInArray(body, self.selectedBodies) && !itemInArray(body, worldBounds)) {
            self.selectedBodies.push(body);
            body.userData.setSelected(true);
        }
        for (var jointEdge = body.GetJointList(); jointEdge; jointEdge = jointEdge.next) {
            if (!itemInArray(jointEdge.joint, self.selectedJoints)) {
                self.addJointToSelected(jointEdge.joint);
            }
        }
    }

   return self;
}

function MoveObjectController () {
    var self = BaseController();

    var mouseJoint = null;

    self.mouseDown = function (point) {
        self.reset();
        var selectedObject = getBodyAtPoint(point);		// получаем тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)

        if (selectedObject) {	// если там было тело
            var def = new b2MouseJointDef();	// создаем соединение между курсором и этим телом
            def.bodyA = ground;
            def.bodyB = selectedObject;
            def.target = point;
            def.collideConnected = true;
            def.maxForce = 10000 * selectedObject.GetMass();
            def.dampingRatio = 0;

            mouseJoint = world.CreateJoint(def);	// доб. соединение к миру

            selectedObject.SetAwake(true);	// будим тело

	        propertiesObject(selectedObject);
        }
    }

    self.mouseMove = function (point) {
        if (mouseJoint) {		// если есть соединение с курсором
            mouseJoint.SetTarget(point);	 // уст. новую точку курсора
        }
    }

    self.mouseUp = function (point) {
        self.reset();
    }

    self.reset = function () {
        if (mouseJoint) {	// если курсор был соединен с телом
            world.DestroyJoint(mouseJoint);	// уничтожаем соединение
            mouseJoint = null;
        }
    }

    return self;
}

function SelectOrMoveController (selectionController, moveController) {
    var self = BaseController();

    var selectionController = selectionController;
    var moveController = moveController;

    var currentController = selectionController;

    self.mouseDown = function (point) {
        // если есть уже выделенные фигуры, то можем выделять selectController'ом
        var clickedBody = getBodyAtPoint(point);
        if (clickedBody) {
            currentController = moveController;
            selectionController.clearSelection();
            selectionController.addBodyToSelected(clickedBody);
        } else {
            currentController = selectionController;
        }
        currentController.mouseDown(point);
    }

    self.mouseMove = function (point) {
        currentController.mouseMove(point);
    }

    self.mouseUp = function (point) {
        currentController.mouseUp(point);
        currentController = selectionController;
    }

    self.keyPressed = function () {
        currentController.keyPressed();
    }

    self.reset = function () {
        currentController.reset();
    }

    self.getPoints = function () {
        return currentController.getPoints();
    }

    return self;
}

function JointCreationController (jointBuilder) {
    var self = BaseController();

    var bodies = [];
    var points = [];

    self._jointBuilder = jointBuilder;

    self.mouseUp = function (point) {
        var body = getBodyAtPoint(point, true);
        if (self._jointBuilder.isValid(body, bodies.length)) {
            if (body) {
                bodies.push(body);
            }
            points.push(point);
        }
        if (points.length == self._jointBuilder.REQUIRED_OBJECTS_COUNT) {
            self._jointBuilder.createJoint(bodies, points);
            self.reset();
            jointCreated();
        }
    };

    self.reset = function () {
        bodies = [];
        points = [];
    };

    return self;
}

function ChainJointCreationController (chainjointBuilder) {
    var self = BaseController();

    var bodies = [];
    var points = [];

    self._chainjointBuilder = chainjointBuilder;

    self.mouseUp = function (point) {
        var body = getBodyAtPoint(point, true);
        if (body) {
            bodies.push(body);
            points.push(point);
        }
        if (bodies.length == 2) {
            self._chainjointBuilder.createChainJoint(bodies, points);
            self.reset();
            jointCreated();
        }
    };

    self.reset = function () {
        bodies = [];
        points = [];
    };

    return self;
}