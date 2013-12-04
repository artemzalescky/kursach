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
    self._startObjectCreation = function() {
        var fixDef = new b2FixtureDef;
        fixDef.density = parseFloat($('#object_density').val());                // плотность
        fixDef.friction = parseFloat($('#object_friction').val());                // коэфициент трения
        fixDef.restitution = parseFloat($('#object_restitution').val());        // коэффицент упругости
        fixDef.isSensor = !($('#object_is_sensor').is(":checked"));             // если isSensor == False, тело твердое

        var bodyDef = new b2BodyDef;
        bodyDef.type = BODY_TYPES[$('#object_body_type').val()];                // тип тела (static, dynamic, kinematic)

        // вызываем строитель объектов
        self._objectBuilder.build(self._objectConstructionPoints, fixDef, bodyDef);
    }

    // PUBLIC поля
    /* сбросить точки */
    self.reset = function() {
        self._objectConstructionPoints = [];
    }

    // абстрактные методы
    self.mouseDown = function(point) {throw new Error()};
    self.mouseUp = function(point) {throw new Error()};

    return self;
}

/* Класс контроллера создания объектов по двум точкам.
    Для создания объекта нужно нажать, потянуть и отпустить мышку. */
function DragCreationController(objectBuilder) {
    var self = ObjectCreationController(objectBuilder);

    self.mouseDown = function(point) {
        self._objectConstructionPoints.push(point);
    }

    self.mouseUp = function(point) {
        self._objectConstructionPoints.push(point);
        if(self._objectConstructionPoints.length == 2) {
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

    self.mouseDown = function(point) {}

    self.mouseUp = function(point) {
        self._objectConstructionPoints.push(point);
    }

    self.enterPressed = function() {
        if(self._objectConstructionPoints) {
            self._startObjectCreation();
            self.reset();
        }
    }

    return self;
}