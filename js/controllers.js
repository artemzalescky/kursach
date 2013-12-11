/* Базовый класс контроллера управляющий созданием объектов.

 Все контроллеры, которые от него наследуются реализуют методы mouseDown и mouseUp,
 благодаря чему можно легко реализовывать разные способы создания объектов.

 objectBuilder - объект, который будет вызываться для создания объектов (строитель объектов). */
function ObjectCreationController(objectBuilder) {
    var self = {};

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
        setObjectType('object_cursor');
    }

    // PUBLIC поля
    /* сбросить точки */
    self.reset = function () {
        self._objectConstructionPoints = [];
    }

    // абстрактные методы
    self.mouseDown = function (point) {
        throw new Error()
    };
    self.mouseUp = function (point) {
        throw new Error()
    };

    return self;
}

/* Класс контроллера создания объектов по двум точкам.
 Для создания объекта нужно нажать, потянуть и отпустить мышку. */
function DragCreationController(objectBuilder) {
    var self = ObjectCreationController(objectBuilder);

    self.mouseDown = function (point) {
        self._objectConstructionPoints.push(point);
    }

    self.mouseUp = function (point) {
        self._objectConstructionPoints.push(point);
        if (self._objectConstructionPoints.length == 2) {
            self._startObjectCreation();
        }
        self.reset();
    }

    return self;
}

/* Класс контроллера создания объектов по любому числу точек.
 Для создания объекта нужно кликать мышкой, в конце нажать Enter. */
function ClickCreationController(objectBuilder) {
    var self = ObjectCreationController(objectBuilder);

    self.mouseDown = function (point) {
    }

    self.mouseUp = function (point) {
        self._objectConstructionPoints.push(point);
    }

    self.enterPressed = function () {
        if (self._objectConstructionPoints) {
            self._startObjectCreation();
            self.reset();
        }
    }

    return self;
}

// контроллер выделения фигур
function SelectController() {
    var self = {};

    var startPoint = new b2Vec2(0, 0); // начальная точка
    var endPoint = new b2Vec2(0, 0); // конечная точка

    var selectedShapes = []; // список выделенных фигур
    var selectedArea = new b2AABB(); // выделенная область
    var activeShapes = []; // список активности фигур

    // устанавливает стартовую точку (координаты x, y - в пикселях)
    self.setStartPoint = function (x, y) {
        startPoint.Set(toMeters(x), toMeters(y));
        endPoint.Set(toMeters(x), toMeters(y));
    }

    self.setEndPoint = function (x, y) {
        endPoint.Set(toMeters(x), toMeters(y));
    }

    // корректирует начальную и конечную точки. xMin, yMin - верхний левый угол. xMax, yMax - нижний правый
    var correctPoints = function () {
        var xMax = (startPoint.x >= endPoint.x) ? startPoint.x : endPoint.x;
        var xMin = (startPoint.x < endPoint.x) ? startPoint.x : endPoint.x;
        var yMax = (startPoint.y >= endPoint.y) ? startPoint.y : endPoint.y;
        var yMin = (startPoint.y < endPoint.y) ? startPoint.y : endPoint.y;
        startPoint.Set(xMin, yMin);
        endPoint.Set(xMax, yMax);
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

    // обновляет выделение
    // @param clear - очистка списка выделенных фигур (true по умолчанию)
    self.updateSelection = function (clear) {
        if (clear === undefined) {
            clear = true;
        }
        if (clear) {
            selectedShapes = [];
        }

        correctPoints();
        selectedArea.lowerBound.Set(startPoint.x, startPoint.y);
        selectedArea.upperBound.Set(endPoint.x, endPoint.y);

        function getBodyCallback(fixture) {
            var shapesAabb = fixture.GetAABB();
            var inside = shapesAabb.TestOverlap(selectedArea);
            if (inside) {
                selectedShapes.push(fixture.GetBody());
            }
            return true;
        }

        activateShapes();
        world.QueryAABB(getBodyCallback, selectedArea);
        deactivateShapes();

        return selectedShapes;
    }

    self.getStartPoint = function () {
        return startPoint;
    }

    self.getEndPoint = function () {
        return endPoint;
    }

    return self;
}

function Painter() {
    var self = {};

    var selectionArea = [];
    for (var i = 0; i < 4; i++) {
        selectionArea.push(new b2Vec2(0, 0));
    }
    var selectionColor = new b2Color(0, 0, 0.85);

    var active = false;

    self.drawAll = function () {
        if (active) {
            debugDraw.DrawPolygon(selectionArea, 4, selectionColor);
        }
    }

    self.setSelectionActive = function (a) {
        active = a;
    }

    self.setSelectionArea = function (p1, p2) {
        selectionArea[0].x = selectionArea[3].x = p1.x;
        selectionArea[0].y = selectionArea[1].y = p1.y;
        selectionArea[1].x = selectionArea[2].x = p2.x;
        selectionArea[2].y = selectionArea[3].y = p2.y;
    }
    return self;
}