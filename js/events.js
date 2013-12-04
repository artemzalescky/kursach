// обработчики событий и состояний 

var mousePressed = false;	// нажата ли кнопка мыши
var mouseJoint = false;		// хранит соединение с мышью

function canvasClicked(event) {		// обработчик клика

    var x = event.offsetX,	// координаты курсора
        y = event.offsetY;

    var objectType = getObjectType();	// что мы выбрали в форме

    if (objectType == 'object_ball') {
        checkValues();
        addBall_expanded(x, y, 20, document.getElementById('object_density').value, document.getElementById('object_restitution').value);
    }
    if (objectType == 'object_box') {
        addBox_expanded(x, y, 40, 40, document.getElementById('object_density').value, document.getElementById('object_restitution').value);
    }
    if (objectType == 'object_human') {
        addHuman_expanded(x, y, 1, document.getElementById('object_density').value, document.getElementById('object_restitution').value);
    }

}

function mouseDown(event) {		// обработчик нажатия мыши
    mousePressed = true;		// флажок, что кликнули

    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали

    if (mouseJoint == false && getObjectType() == "object_cursor") {	// если нет соединения с курсором и мы не выбрали добавление объекта
        event.preventDefault();
        var body = getBodyAtPoint(cursorPoint);		// получаем тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)

        if (body) {	// если там было тело
            var def = new b2MouseJointDef();	// создаем соединение между курсором и этим телом
            def.bodyA = ground;
            def.bodyB = body;
            def.target = cursorPoint;
            def.collideConnected = true;
            def.maxForce = 10000 * body.GetMass();
            def.dampingRatio = 0;

            mouseJoint = world.CreateJoint(def);	// доб. соединение к миру

            body.SetAwake(true);	// будим тело
        }
    }
};

function mouseUp() {	// обработчик "отжатия" мыши
    mousePressed = false;	// флажок на "отжат"

    if (mouseJoint) {	// если курсор был соединен с телом
        world.DestroyJoint(mouseJoint);	// уничтожаем соединение
        mouseJoint = false;
    }
}

function mouseMove(event) {		// обработчик движения курсора
    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// коорд. курсора

    if (mouseJoint) {		// если есть соединение с курсором
        mouseJoint.SetTarget(cursorPoint);	 // уст. новую точку курсора
    }
}

function getObjectType() {		// возвращает тип выбранного объекта из формы
    return $('#add_object_select').val();
}

function getBodyAtPoint(point, includeStatic) {		// тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)
    var aabb = new b2AABB();		// созд. область, где ищем тело
    aabb.lowerBound.Set(point.x - 0.001, point.y - 0.001);
    aabb.upperBound.Set(point.x + 0.001, point.y + 0.001);

    var body = null;

    function GetBodyCallback(fixture) {	// для перекрывающихся тел
        var shape = fixture.GetShape();

        if (fixture.GetBody().GetType() != b2Body.b2_staticBody || includeStatic) {
            var inside = shape.TestPoint(fixture.GetBody().GetTransform(), point);	// попали ли в тело

            if (inside) {
                body = fixture.GetBody();
                return false;
            }
        }

        return true;
    }

    world.QueryAABB(GetBodyCallback, aabb);
    return body;
}