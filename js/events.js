CONTROLLERS = {
    'cursor': SelectOrMoveController(KEY_CODE.CONTROL),
    'object_ball': DragCreationController(BallBuilder()),
    'object_box': DragCreationController(BoxBuilder()),
    'object_poly': VariableClicksCreationController(PolyBuilder(), KEY_CODE.ENTER, 3)
}

PAINTERS = {
    'cursor' : SelectionPainter(),
    'object_ball' : BallContourPainter(),
    'object_box' : BoxContourPainter(),
    'object_poly' : PolygonContourPainter()
}

var painter = PAINTERS.cursor;
var currentController = CONTROLLERS.cursor;

var mousePressed = false;	// нажата ли кнопка мыши
var selectedObject = null;		// выделенный объект (b2Body (или null, если ни в кого не попали))

var arr = [];
var i = 0;


function mouseDown(event) {		// обработчик нажатия мыши
    mousePressed = true;		// флажок, что кликнули
    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
    currentController.mouseDown(cursorPoint);

//    if (action_type == "action_joint" && object_type == "object_cursor") { //если выбрали соединение
//        var body = getBodyAtPoint(cursorPoint); // получаем тело фигуры, которая находится там где кликнули
//
//        if (body) { // если тело там было
//            i++;
//            arr.push(body); //добавляем в массив объект
//            if (i == 2) { //если добавили два объекта, то делаем между ними соединение
//                create_joint(arr); //функция создания соединения
//                i = 0;
//            }
//        }
//    }

//    if (action_type == "action_delete" & object_type == "object_cursor") { //если выбрали удаление
//		selectedObject = getBodyAtPoint(cursorPoint, true);     // получаем тело фигуры, которая находится там где кликнули
//        if (selectedObject) { // если тело там было
//            world.DestroyBody(selectedObject);
//        }
//    }
}

function mouseUp() {	// обработчик "отжатия" мыши
    mousePressed = false;	// флажок на "отжат"
    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
    currentController.mouseUp(cursorPoint);
}

function mouseMove(event) {		// обработчик движения курсора
    if (mousePressed) {
        var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));
        currentController.mouseMove(cursorPoint);
    }
}

// обработчик нажатия клавиш
function keyDown(event) {
    currentController.keyDown(event.which);
}

function keyUp(event) {
    currentController.keyUp(event.which);
}

// обработчик изменения полей данных
function inputDataChanged(event) {
    // проверяем попадание в диапазон значений только для числовых инпутов
    if (event.target.type === 'number') {
        checkInputValueRange(event.target);
    }

    // устанавливаем строитель объектов
    if (event.target.id === 'add_object_select') {
        objectType = getObjectType();
        switch (objectType) {
            case 'object_ball':
            case 'object_box':
            case 'object_poly':
                currentController = CONTROLLERS[objectType];
                currentController.reset();
                painter = PAINTERS[objectType];
                break;
            default:
                currentController = CONTROLLERS.cursor;
                painter = PAINTERS.cursor;
        }
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

function create_joint(arr) { // создание соединения между двумя объектами
    var body1 = arr.pop();
    var body2 = arr.pop();

    var def = new Box2D.Dynamics.Joints.b2DistanceJointDef();
    def.Initialize(
        body2,
        body1,
        body2.GetWorldCenter(),
        body1.GetWorldCenter()
    );
    def.length = 5;
    def.collideConnected = true;
    world.CreateJoint(def);
    body1.SetAwake(true);  //будим тело 1
    body2.SetAwake(true);  //будим тело 2
}

function pauseButtonEvent(event) {
    worldActivated = !worldActivated;
    for (var shape = world.GetBodyList(); shape; shape = shape.GetNext()) {
        shape.SetActive(worldActivated);
    }
}