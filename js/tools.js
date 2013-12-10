/* В этот файл помещать небольшиие вспомогательные функции */

function item_in_array (item, arr) {
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

    world.QueryAABB(GetBodyCallback, aabb);
    return body;
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