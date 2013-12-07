/* Базовый класс контроллера, ничего не реализует, просто декларирует методы */
function BaseController () {
    var self = {};

    self.mouseDown = function (point) {};
    self.mouseMove = function (point) {};
    self.mouseUp = function (point) {};
    self.keyDown = function (key_code) {};
    self.keyUp = function (key_code) {};
    self.reset = function () {};
    self.getPoints = function () {};

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

        // вызываем строитель объектов
        self._objectBuilder.build(self._objectConstructionPoints, fixDef, bodyDef);

        self.reset();
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
    var activeShapes = []; // список активности фигур

    self.selectedBodies = []; // список выделенных фигур

    // устанавливает стартовую точку (координаты x, y - в пикселях)
    self.mouseDown = function (point) {
        console.log('down ', selectionPoints.length);
        selectionPoints = [point, point];
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
                self.selectedBodies.push();
            }
            return true;
        }

        activateShapes();
        world.QueryAABB(getBodyCallback, selectedArea);
        deactivateShapes();
        console.log('selected ', self.selectedBodies.length);
    }

    self.reset = function () {
        selectionPoints = [];
    }

    self.getPoints = function () {
        return selectionPoints;
    }

    // корректирует начальную и конечную точки. xMin, yMin - верхний левый угол. xMax, yMax - нижний правый
    var correctPoints = function () {
        startPoint = selectionPoints[0];
        endPoint = selectionPoints[1];
        var xMax = (startPoint.x >= endPoint.x) ? startPoint.x : endPoint.x;
        var xMin = (startPoint.x < endPoint.x) ? startPoint.x : endPoint.x;
        var yMax = (startPoint.y >= endPoint.y) ? startPoint.y : endPoint.y;
        var yMin = (startPoint.y < endPoint.y) ? startPoint.y : endPoint.y;
        selectionPoints = [new b2Vec2(xMin, yMin), new b2Vec2(xMax, yMax)];
    }

    // активирует все фигуры для того, чтобы можно было выделить даже неактивные
    // ATTENTION! обязателен вызов в паре с deactivateShapes
    var activateShapes = function () {
        var shapes = world.GetBodyList();
        while (shapes) {
            activeShapes.push(shapes.IsActive());
            shapes.SetActive(true);
            shapes = shapes.GetNext();
        }
    }

    // возвращает все фигуры в исходное состояние
    var deactivateShapes = function () {
        var shapes = world.GetBodyList();
        while (shapes) {
            shapes.SetActive(activeShapes.shift());
            shapes = shapes.GetNext();
        }
    }

    return self;
}

function Painter() {
    var self = {};

    self.draw = function() {
        self._draw(currentController.getPoints());
        //self._draw(selectedObjectBuilder.creationController.getPoints());
    }

    self._draw = function(points) { throw new Error; }

    return self;
}

function SelectionPainter() {
    var self = Painter();

    var selectionArea = [];
    for (var i = 0; i < 4; i++) {
        selectionArea.push(new b2Vec2(0, 0));
    }

    self._draw = function(points) {
        if (points) {
            selectionArea[0].x = selectionArea[3].x = points[0].x;
            selectionArea[0].y = selectionArea[1].y = points[0].y;
            selectionArea[1].x = selectionArea[2].x = points[1].x;
            selectionArea[2].y = selectionArea[3].y = points[1].y;
            debugDraw.DrawPolygon(selectionArea, 4, COLOR_SELECTED_AREA);
        }
    }

    return self;
}

function BallContourPainter() {
    var self = Painter();

    self._draw = function(points) {
        var dx = points[0].x - points[1].x;
        var dy = points[0].y - points[1].y;
        var radius = Math.sqrt(dx * dx + dy * dy);
        debugDraw.DrawCircle(points[0], radius, COLOR_CONTOUR_SHAPE);
    }
}

function PolygonContourPainter() {
    var self = Painter();

    self._draw = function(points) {
        if (points.length > 2) {
            debugDraw.DrawPolygon(points, points.length, COLOR_CONTOUR_SHAPE);
        }
    }
}

function BoxContourPainter() {
    var self = Painter();

    var contour = [];
    for (var i = 0; i < 4; i++) {
        contour.push(new b2Vec2(0, 0));
    }

    self._draw = function(points) {
        contour[0].x = contour[3].x = points[0].x;
        contour[0].y = contour[1].y = points[0].y;
        contour[1].x = contour[2].x = points[1].x;
        contour[2].y = contour[3].y = points[1].y;
        debugDraw.DrawPolygon(contour, 4, COLOR_CONTOUR_SHAPE);
    }

    return self;
}
