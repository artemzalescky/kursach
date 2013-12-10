/* Базовый класс контроллера, ничего не реализует, просто декларирует методы */
function BaseController () {
    var self = {};

    self.mouseDown = function (point) {};
    self.mouseMove = function (point) {};
    self.mouseUp = function (point) {};
    self.keyDown = function (key_code) {};
    self.keyUp = function (key_code) {};
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
function VariableClicksCreationController(objectBuilder, finishKeyCode, minPointsNumber) {
    var self = ObjectCreationController(objectBuilder);

    if (minPointsNumber === undefined) {
        minPointsNumber = 1;
    }

    self.mouseUp = function (point) {
        self._objectConstructionPoints.push(point);
    }

    self.keyUp = function (key_code) {
        if (key_code === finishKeyCode && self._objectConstructionPoints.length >= minPointsNumber) {
            self._startObjectCreation();
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
function SelectionController(hold_key_code) {
    var self = BaseController();

    var holding = false;        // зажата ли клавиша сохранения выделенных объектов

    var selectionPoints = [];
    var selectedArea = new b2AABB(); // выделенная область

    self.selectedBodies = []; // список выделенных фигур

    // устанавливает стартовую точку (координаты x, y - в пикселях)
    self.mouseDown = function (point) {
        selectionPoints = [point, point];
        console.log('down ', selectionPoints.length);
    }

    self.mouseMove = function (point) {
        console.log('move ', selectionPoints.length);
        selectionPoints[1] = point;
    }

    self.mouseUp = function (point) {
        console.log('up ', selectionPoints.length);
        if (!holding) {
            self.selectedBodies = [];
        }

        correctPoints();
        selectedArea.lowerBound.Set(selectionPoints[0].x, selectionPoints[0].y);
        selectedArea.upperBound.Set(selectionPoints[1].x, selectionPoints[1].y);

        function getBodyCallback(fixture) {
            var shapesAabb = fixture.GetAABB();
            var inside = shapesAabb.TestOverlap(selectedArea);
            if (inside) {
                body = fixture.GetBody();
                if (!item_in_array(body, self.selectedBodies)) {
                    self.selectedBodies.push(body);
                }
            }
            return true;
        }

        var activeBodies = activateAllBodies();
        world.QueryAABB(getBodyCallback, selectedArea);
        deactivateAllBodies(activeBodies);
        self.reset();
        console.log('selected ', self.selectedBodies.length);
    }

    self.keyDown = function (key_code) {
        if (key_code === hold_key_code) {
            holding = true;
        }
    }

    self.keyUp = function (key_code) {
        if (key_code === hold_key_code) {
            holding = false;
        }
    }

    self.reset = function () {
        selectionPoints = [];
    }

    self.getPoints = function () {
        return selectionPoints;
    }

    // корректирует начальную и конечную точки. xMin, yMin - верхний левый угол. xMax, yMax - нижний правый
    var correctPoints = function () {
        var startPoint = selectionPoints[0];
        var endPoint = selectionPoints[1];
        var xMax = (startPoint.x >= endPoint.x) ? startPoint.x : endPoint.x;
        var xMin = (startPoint.x < endPoint.x) ? startPoint.x : endPoint.x;
        var yMax = (startPoint.y >= endPoint.y) ? startPoint.y : endPoint.y;
        var yMin = (startPoint.y < endPoint.y) ? startPoint.y : endPoint.y;
        selectionPoints = [new b2Vec2(xMin, yMin), new b2Vec2(xMax, yMax)];
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

function SelectOrMoveController (hold_key_code) {
    var self = BaseController();

    var selectionController = SelectionController(hold_key_code);
    var moveController = MoveObjectController();

    var currentController = selectionController;

    self.mouseDown = function (point) {
        if (getBodyAtPoint(point)) {
            currentController = moveController;
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
    }

    self.keyDown = function (key_code) {
        currentController.keyDown(key_code);
    }

    self.keyUp = function (key_code) {
        currentController.keyUp(key_code);
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
        body = getBodyAtPoint(point);
        if (body) {
            bodies.push(body);
            points.push(point);
        }
        if (bodies.length == self._jointBuilder.REQUIRED_BODIES_NUMBER) {
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