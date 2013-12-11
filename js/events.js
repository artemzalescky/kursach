CONTROLLERS = {
    'cursor': SelectOrMoveController(),
    'object_ball': DragCreationController(BallBuilder()),
    'object_box': DragCreationController(BoxBuilder()),
    'object_poly': VariableClicksCreationController(PolyBuilder(), 3),
    'distance_joint': JointCreationController(DistanceJointBuilder()),
    'revolute_joint': JointCreationController(RevoluteJointBuilder()),
    'prismatic_joint': JointCreationController(PrismaticJointBuilder())
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
function keyDown (event) {
    keyController.keyPressed(event);
    currentController.keyPressed();
}

function keyUp (event) {
    keyController.keyUp(event);
}

function slidingToggleTriggered (event) {
    var button = $(event.target);
    var prevToggledButtonId = toggledButtonId;
    closeAllSlidingToggles();

    if (button.attr('id') != prevToggledButtonId) {
        toggledButtonId = button.attr('id');

        var panel = button.parent().find('.toggle_panel');
        panel.slideDown("fast");
        button.addClass('toggle_button_enabled');

        switch (button.attr('id')) {
            case 'create_object_button':
                switchController(getObjectType());
                break;
            case 'create_joint_button':
                switchController(getJointType());
                break;
            default:
                switchController();
        }
    }
}

function closeAllSlidingToggles() {
    var block = $('#sliding_toggles_block');
    block.find('.toggle_panel').slideUp('fast');
    block.find('.toggle_button').removeClass('toggle_button_enabled');
    toggledButtonId = null;
}

function switchController(controllerType) {
    if (controllerType in CONTROLLERS) {
        currentController = CONTROLLERS[controllerType];
        currentController.reset();
    } else {
        currentController = CONTROLLERS.cursor;
    }

    if (controllerType in PAINTERS) {
        painter = PAINTERS[controllerType];
    } else {
        painter = PAINTERS.cursor;
    }
}

function objectCreated() {  // вызывается сразу после создания объекта
    closeAllSlidingToggles();
    switchController();
}

function jointCreated() {  // вызывается сразу после создания объекта
    closeAllSlidingToggles();
    switchController();
}

// обработчик изменения полей данных
function inputDataChanged(event) {
    // проверяем попадание в диапазон значений только для числовых инпутов
    if (event.target.type === 'number') {
        checkInputValueRange(event.target);
    }

    if (event.target.id === 'add_object_select') {
        switchController(getObjectType());
    } else if (event.target.id === 'joint_select') {
        switchController(getJointType());
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