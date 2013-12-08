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


function mouseDown(event) {		// обработчик нажатия мыши
    mousePressed = true;		// флажок, что кликнули
    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
    currentController.mouseDown(cursorPoint);
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

function createObjectTriggered () {
    $("#create_object_panel").slideToggle("fast");
    isChecked = toggleButton('create_object_button');
    switchObject(isChecked ? getObjectType() : '');
}

function switchObject(objectType) {
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

function objectCreated() {  // вызывается сразу после создания объекта
    createObjectTriggered();
}

// обработчик изменения полей данных
function inputDataChanged(event) {
    // проверяем попадание в диапазон значений только для числовых инпутов
    if (event.target.type === 'number') {
        checkInputValueRange(event.target);
    }

    // устанавливаем строитель объектов
    if (event.target.id === 'add_object_select') {
        switchObject(getObjectType());
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

function pauseButtonTriggered(event) {
    worldActivated = !toggleButton('pause_simulation_button');
    for (var shape = world.GetBodyList(); shape; shape = shape.GetNext()) {
        shape.SetActive(worldActivated);
    }
}