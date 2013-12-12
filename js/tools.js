/* В этот файл помещать небольшиие вспомогательные функции */

function itemInArray (item, arr) {
    return arr.indexOf(item) != -1;
}

function toMeters(pixels) {		// перевод из пикселей в метры
    return pixels / SCALE;
}

function toRadian(degrees) {  // перевод из градусов в радианы (в box2d угол в радианах)
    return degrees * Math.PI / 180;
}

function toDegrees(degrees) {  // перевод из радианы в градусов
    return degrees * 180 / Math.PI;
}

function getObjectType() {		// возвращает тип выбранного объекта из формы
    return $('#add_object_select').val();
}

function getJointType() {		// возвращает действие выбранного объекта из формы
    return $('#joint_select').val();
}

function getBodyAtPoint(point, includeStatic) {		// тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)
    var aabb = new b2AABB();		// созд. область, где ищем тело
    aabb.lowerBound.Set(point.x - 0.001, point.y - 0.001);
    aabb.upperBound.Set(point.x + 0.001, point.y + 0.001);

    var body = null;

    function GetBodyCallback(fixture) {	// для перекрывающихся тел
        var shape = fixture.GetShape();

        if ((fixture.GetBody().GetType() != b2Body.b2_staticBody || includeStatic) && fixture.IsSensor() == false) { // сенсоры не выделяются (чтоб тело в воде можно было выделить)
            var inside = shape.TestPoint(fixture.GetBody().GetTransform(), point);	// попали ли в тело

            if (inside) {
                body = fixture.GetBody();
                return false;
            }
        }

        return true;
    }

    var activeBodies = activateAllBodies();
    world.QueryAABB(GetBodyCallback, aabb);
    deactivateAllBodies(activeBodies);

    return body;
}

// активирует все фигуры для того, чтобы можно было выделить даже неактивные
// ATTENTION! обязателен вызов в паре с deactivateShapes
var activateAllBodies = function () {
    var bodies = world.GetBodyList();
    var activeBodies = [];
    while (bodies) {
        activeBodies.push(bodies.IsActive());
        bodies.SetActive(true);
        bodies = bodies.GetNext();
    }
    return activeBodies;
}

// возвращает все фигуры в исходное состояние
var deactivateAllBodies = function (activeBodies) {
    var bodies = world.GetBodyList();
    while (bodies) {
        bodies.SetActive(activeBodies.shift());
        bodies = bodies.GetNext();
    }
}

function toggleButton (buttonId) {
    selector = '#' + buttonId;
    isChecked = $(selector).hasClass('toggle_button_enabled');
    if (isChecked) {
        $(selector).removeClass('toggle_button_enabled');
    } else {
        $(selector).addClass('toggle_button_enabled');
    }
    return !isChecked;
}

function deleteObjects (bodies) {
    for (i = 0; i < bodies.length; i++) {
        world.DestroyBody(bodies[i]);
    }
}

function hexToRgb(hex) {
    hex = (hex.charAt(0) == "#") ? hex.substring(1,7) : hex;
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    return new b2Color(r, g, b);
}