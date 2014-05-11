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

function deleteObject(body) {
    body.userData.destroy();
    world.DestroyBody(body);
}

function deleteObjects (bodies) {
    for (i = 0; i < bodies.length; i++) {
        deleteObject(bodies[i]);
    }
}

function deleteJoint(joint) {
    joint.userData.destroy();
    world.DestroyJoint(joint);
}

function deleteJoints(joints) {
    for (i = 0; i < joints.length; ++i) {
        deleteJoint(joints[i]);
    }
}

function hexToRgb(hex) {
    hex = (hex.charAt(0) == "#") ? hex.substring(1,7) : hex;
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    return new b2Color(r, g, b);
}

var correctedPoints = function (points) {
    var startPoint = points[0];
    var endPoint = points[1];
    var xMax = (startPoint.x >= endPoint.x) ? startPoint.x : endPoint.x;
    var xMin = (startPoint.x < endPoint.x) ? startPoint.x : endPoint.x;
    var yMax = (startPoint.y >= endPoint.y) ? startPoint.y : endPoint.y;
    var yMin = (startPoint.y < endPoint.y) ? startPoint.y : endPoint.y;
    return [new b2Vec2(xMin, yMin), new b2Vec2(xMax, yMax)];
}

// functions for d3 transformations
var translateStr = function(p1, p2) {
    return "translate(" + p1 + "," + p2 + ")";
}

var rotateStr = function(degreeAngle) {
    return "rotate(" + degreeAngle + ")";
}

var scaleStr = function(sx, sy) {
    return "scale(" + sx + "," + sy + ")";
}

var getAngle = function(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var angle = Math.atan2(dy, dx);
    var degreeAngle = toDegrees(angle) + 360;
    return degreeAngle % 360;
}

var getDistance = function(p1, p2) {
    var vectLength = new b2Vec2(p1.x - p2.x, p2.y - p1.y);
    return vectLength.Length();
}

var pointsToSvgLinePx = d3.svg.line()
    .x(function(point) {return point.x;})
    .y(function(point) {return point.y;})
    .interpolate("linear");