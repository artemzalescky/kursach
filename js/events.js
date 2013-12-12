CONTROLLERS = {
    'cursor': SelectOrMoveController(),
    'object_ball': DragCreationController(BallBuilder()),
    'object_box': DragCreationController(BoxBuilder()),
    'object_poly': VariableClicksCreationController(PolyBuilder(), 3),
    'distance_joint': JointCreationController(DistanceJointBuilder()),
    'revolute_joint': JointCreationController(RevoluteJointBuilder()),
    'prismatic_joint': JointCreationController(PrismaticJointBuilder()),
    'gear_joint': JointCreationController(GearJointBuilder()),
    'pulley_joint': JointCreationController(PulleyJointBuilder())
}

PAINTERS = {
    'cursor' : SelectionPainter(),
    'object_ball' : BallContourPainter(),
    'object_box' : BoxContourPainter(),
    'object_poly' : PolygonContourPainter()
}

var painter = PAINTERS.cursor;
var currentController = CONTROLLERS.cursor;
var toggledButtonId = null;
keyController = KeysController();

var mousePressed = false;	// нажата ли кнопка мыши


function mouseDown(event) {		// обработчик нажатия мыши
    mousePressed = true;		// флажок, что кликнули
    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
    selectController.setStartPoint(event.offsetX, event.offsetY);

    if (getActionType() == "action_joint" & getObjectType() == "object_cursor") { //если выбрали соединение
       	addBodyForJoint(cursorPoint);
        }

function mouseUp() {	// обработчик "отжатия" мыши
    mousePressed = false;	// флажок на "отжат"
        var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
        selectedObjectBuilder.creationController.mouseUp(cursorPoint);
    }

function mouseMove(event) {		// обработчик движения курсора
    if (mousePressed) {
        selectController.setEndPoint(event.offsetX, event.offsetY);
        if (!mouseJoint) {
            painter.setSelectionActive(true);
            painter.setSelectionArea(selectController.getStartPoint(), selectController.getEndPoint());
        }
    }

// обработчик нажатия клавиш
function keyPressed(event) {
    if (event.which === KEY_CODE.ENTER) {
        // не все контроллеры обрабатывают нажатие клавиши enter
        if (selectedObjectBuilder.creationController.enterPressed) {
            selectedObjectBuilder.creationController.enterPressed();
        }

function getObjectType() {		// возвращает тип выбранного объекта из формы
    return $('#add_object_select').val();
}

function getJointType(){		//возвращает тип выбранного соединения из формы
	return $('#add_joint_select').val();
}

function getActionType() {		// возвращает действие выбранного объекта из формы
    return $('#add_object_action').val();
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

// обработчик изменения полей данных
function inputDataChanged(event) {
    // проверяем попадание в диапазон значений только для числовых инпутов
    if (event.target.type === 'number') {
        checkInputValueRange(event.target);
    }

    if (event.target.id === 'add_object_select') {
        objectType = getObjectType();
        switch (objectType) {
            case 'object_ball':
            case 'object_box':
            case 'object_poly':
                selectedObjectBuilder = BUILDERS[objectType];
                break;
            default:
                selectedObjectBuiler = null;
        }
    }

function checkInputValueRange(input_object) {
    // проверка на выход за предельные значения
    if (parseFloat(input_object.value) < parseFloat(input_object.min)) {
        input_object.value = input_object.min;
    } else if (parseFloat(input_object.value) > parseFloat(input_object.max)) {
        input_object.value = input_object.max;
    }
}

function pauseButtonEvent(event) {
    worldActivated = !worldActivated;
    for (var shape = world.GetBodyList(); shape; shape = shape.GetNext()) {
        shape.SetActive(worldActivated);
    }
}