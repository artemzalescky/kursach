// обработчики событий и состояний
var selectController = SelectController();

var mousePressed = false;	// нажата ли кнопка мыши
var mouseJoint = false;		// хранит соединение с мышью
var selectedObjectBuilder = undefined;      // текущий строитель объектов
var selectedObject = null;		// выделенный объект (b2Body (или null, если ни в кого не попали))

var arr = [];
var i = 0;


function mouseDown(event) {		// обработчик нажатия мыши
    event.preventDefault();     // отменить обычное действие события
    mousePressed = true;		// флажок, что кликнули
    var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали

    selectController.setStartPoint(event.offsetX, event.offsetY);

    if (getActionType() == "action_joint" & getObjectType() == "object_cursor") { //если выбрали соединение
        var body = getBodyAtPoint(cursorPoint); // получаем тело фигуры, которая находится там где кликнули

        if (body) { // если тело там было
            i++;
            arr.push(body); //добавляем в массив объект
            if (i == 2) { //если добавили два объекта, то делаем между ними соединение
                create_joint(arr); //функция создания соединения
                i = 0;
            }
        }
    }
    if (getActionType() == "action_delete" & getObjectType() == "object_cursor") { //если выбрали удаление
		selectedObject = getBodyAtPoint(cursorPoint, true);     // получаем тело фигуры, которая находится там где кликнули
        if (selectedObject) { // если тело там было
            world.DestroyBody(selectedObject);
        }
    } else if (mouseJoint == false && getObjectType() == "object_cursor" & getActionType() == "action_drag") {	// если нет соединения с курсором и мы не выбрали добавление объекта
        event.preventDefault();
        selectedObject = getBodyAtPoint(cursorPoint, true);		// получаем тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)

        if (selectedObject) {	// если там было тело

            // выводим в "Свойства объекта" св-ва выделенного объекта
            document.getElementById('object_density').value = selectedObject.GetFixtureList().GetDensity();
            document.getElementById('object_restitution').value = selectedObject.GetFixtureList().GetRestitution();
            document.getElementById('object_friction').value = selectedObject.GetFixtureList().GetFriction();
            //для угла поворота
            document.getElementById('object_gradus').value = toDegrees(selectedObject.GetAngle());

            var def = new b2MouseJointDef();	// создаем соединение между курсором и этим телом
            def.bodyA = ground;
            def.bodyB = selectedObject;
            def.target = cursorPoint;
            def.collideConnected = true;
            def.maxForce = 10000 * selectedObject.GetMass();
            def.dampingRatio = 0;

            mouseJoint = world.CreateJoint(def);	// доб. соединение к миру

            selectedObject.SetAwake(true);	// будим тело
        }
    } else if (selectedObjectBuilder) {
        selectedObjectBuilder.creationController.mouseDown(cursorPoint);
    }
};

function mouseUp() {	// обработчик "отжатия" мыши
    mousePressed = false;	// флажок на "отжат"

    selectController.updateSelection();
    painter.setSelectionActive(false);

    if (mouseJoint) {	// если курсор был соединен с телом
        world.DestroyJoint(mouseJoint);	// уничтожаем соединение
        mouseJoint = false;
    } else if (selectedObjectBuilder) {
        var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
        selectedObjectBuilder.creationController.mouseUp(cursorPoint);
    }
}

function mouseMove(event) {		// обработчик движения курсора
    if (mousePressed) {
        selectController.setEndPoint(event.offsetX, event.offsetY);
        if (!mouseJoint) {
            painter.setSelectionActive(true);
            painter.setSelectionArea(selectController.getStartPoint(), selectController.getEndPoint());
        }
    }
    if (mouseJoint) {		// если есть соединение с курсором
        var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
        mouseJoint.SetTarget(cursorPoint);	 // уст. новую точку курсора
    }
}

// обработчик нажатия клавиш
function keyPressed(event) {
    if (event.which === KEY_CODE.ENTER) {
        // не все контроллеры обрабатывают нажатие клавиши enter
        if (selectedObjectBuilder.creationController.enterPressed) {
            selectedObjectBuilder.creationController.enterPressed();
        }
    }
}

function getObjectType() {		// возвращает тип выбранного объекта из формы
    return $('#add_object_select').val();
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

    // устанавливаем строитель объектов
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