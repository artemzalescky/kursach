CONTROLLERS = {
    'action_select': SelectionController(0),
    'object_ball': DragCreationController(BallBuilder()),
    'object_box': DragCreationController(BoxBuilder()),
    'object_poly': VariableClicksCreationController(PolyBuilder(), KEY_CODE.ENTER, 3)
}

var currentController = CONTROLLERS.action_select;

var mousePressed = false;	// нажата ли кнопка мыши
var mouseJoint = false;		// хранит соединение с мышью
var selectedObject = null;		// выделенный объект (b2Body (или null, если ни в кого не попали))

var arr = [];
var i = 0;


function mouseDown(event) {		// обработчик нажатия мыши
    event.preventDefault();     // отменить обычное действие события

    mousePressed = true;		// флажок, что кликнули
    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали

    action_type = getActionType();
    object_type = getObjectType();

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
//    } else

//    if (mouseJoint == false && object_type == "object_cursor" & action_type == "action_drag") {	// если нет соединения с курсором и мы не выбрали добавление объекта
//        selectedObject = getBodyAtPoint(cursorPoint, true);		// получаем тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)
//
//        if (selectedObject) {	// если там было тело
//
//            // выводим в "Свойства объекта" св-ва выделенного объекта
//            document.getElementById('object_density').value = selectedObject.GetFixtureList().GetDensity();
//            document.getElementById('object_restitution').value = selectedObject.GetFixtureList().GetRestitution();
//            document.getElementById('object_friction').value = selectedObject.GetFixtureList().GetFriction();
//            //для угла поворота
//            document.getElementById('object_gradus').value = toDegrees(selectedObject.GetAngle());
//
//            var def = new b2MouseJointDef();	// создаем соединение между курсором и этим телом
//            def.bodyA = ground;
//            def.bodyB = selectedObject;
//            def.target = cursorPoint;
//            def.collideConnected = true;
//            def.maxForce = 10000 * selectedObject.GetMass();
//            def.dampingRatio = 0;
//
//            mouseJoint = world.CreateJoint(def);	// доб. соединение к миру
//
//            selectedObject.SetAwake(true);	// будим тело
//        }
//    } else {
        currentController.mouseDown(cursorPoint);
//    }
};

function mouseUp() {	// обработчик "отжатия" мыши
    mousePressed = false;	// флажок на "отжат"

    painter.setSelectionActive(false);

    if (mouseJoint) {	// если курсор был соединен с телом
        world.DestroyJoint(mouseJoint);	// уничтожаем соединение
        mouseJoint = false;
    } else if (currentController) {
        var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
        currentController.mouseUp(cursorPoint);
    }
}

function mouseMove(event) {		// обработчик движения курсора
    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));

    if (mousePressed) {
        if (!mouseJoint) {
            painter.setSelectionActive(true);
            painter.setSelectionArea(currentController.getPoints());
        }
        currentController.mouseMove(cursorPoint);
    }
    if (mouseJoint) {		// если есть соединение с курсором

        mouseJoint.SetTarget(cursorPoint);	 // уст. новую точку курсора
    }
}

// обработчик нажатия клавиш
function keyDown(event) {
    if (currentController) {
        currentController.keyDown(event.which);
    }
}

function keyUp(event) {
    if (currentController) {
        currentController.keyUp(event.which);
    }
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
                break;
            default:
                currentController = CONTROLLERS.action_select;
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