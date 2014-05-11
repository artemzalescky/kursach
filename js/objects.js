/* Базовый класс строителя объектов
 Наследники реализуют метод build, который должен создавать форму и базовую точка и вызывать _createObject.
 Также наследники хранят публичное поле creationController которое зависит от способа конструирования объекта */
function ObjectBuilder() {
    var self = {};
    self._objectView = null;

    // PROTECTED
    /* Создать объект
     x, y - базовая точка
     shape - форма фигуры box2d (b2Shape)
     fixDef, bodyDef - сконфигурированные дефенишены */
    self._createObject = function (x, y, shape, fixDef, bodyDef) {
        fixDef.shape = shape;

        bodyDef.position.x = x;				// координаты позиции тела
        bodyDef.position.y = y;

        var body = world.CreateBody(bodyDef);	// создаем тело
        body.CreateFixture(fixDef);				// прикрепляем к телу фигуру
        var color = $('#object_color').val();
        body.userData = self._objectView(body, color); // устанавливаем отрисовщик
        return body;
    }

    self.build = function (points, fixDef, bodyDef) {
        throw new Error()
    };     // абстрактный метод

    self.creationController = undefined;

    return self;
}

/* Класс строителя шаров */
function BallBuilder() {
    var self = ObjectBuilder();
    self._objectView = BallView;

    /* Создать и вернуть шар.
     points - массив из двух точек, центра и одной из точек окружности */
    self.build = function (points, fixDef, bodyDef) {
        // получаем центр шара
        x = points[0].x;
        y = points[0].y;

        // вычисляем радиус
        dx = points[1].x - x;
        dy = points[1].y - y;
        radius = Math.sqrt(dx * dx + dy * dy)

        shape = new b2CircleShape(radius);

        return self._createObject(x, y, shape, fixDef, bodyDef);
    }

    return self;
}

/* Класс строителя прямоугольников */
function BoxBuilder() {
    var self = ObjectBuilder();
    self._objectView = PolygonView;

    /* Создать и вернуть прямоугольник.
     points - массив из двух точек которые образуют диагональ прямоугольника. */
    self.build = function (points, fixDef, bodyDef) {
        // вычисление ширины и высоты
        width = Math.abs(points[1].x - points[0].x);
        height = Math.abs(points[1].y - points[0].y);

        // вычисление центра
        x = (points[0].x + points[1].x) / 2;
        y = (points[0].y + points[1].y) / 2;

        shape = new b2PolygonShape;		// фигура - многоугольник
        shape.SetAsBox(width / 2, height / 2);		// прямоугольник

		if(fixDef.isSensor == true)
			setupBuoyancyController(points[0].y*SCALE);					// настраиваем контроллер плавучести

        return self._createObject(x, y, shape, fixDef, bodyDef);
    }

    return self;
}

/* Класс строителя многоугольников.
 Многоугольники должны быть выпуклыми и точки должны задаваться по часовой стрелке. */
function PolyBuilder() {
    var self = ObjectBuilder();
    self._objectView = PolygonView;

    /* Создать и вернуть многоугольник.
     points - массив точек многоугольника. */
    self.build = function (points, fixDef, bodyDef) {
        if (points.length < 3) {
            return null;
        }

        shape = new b2PolygonShape;		// фигура - многоугольник
        shape.SetAsArray(points, points.length);		// устанавливаем форму многоугольника (массив вершин)

        return self._createObject(0, 0, shape, fixDef, bodyDef);
    }

    return self;
}


