var selectionController = SelectionController();
CONTROLLERS = {
    'cursor': SelectOrMoveController(selectionController, MoveObjectController()),
    'object_ball': DragCreationController(BallBuilder()),
    'object_box': DragCreationController(BoxBuilder()),
    'object_poly': VariableClicksCreationController(PolyBuilder(), 3),
    'distance_joint': JointCreationController(DistanceJointBuilder()),
    'revolute_joint': JointCreationController(RevoluteJointBuilder()),
    'prismatic_joint': JointCreationController(PrismaticJointBuilder()),
    'gear_joint': JointCreationController(GearJointBuilder()),
    'pulley_joint': JointCreationController(PulleyJointBuilder()),
    'chain': ChainJointCreationController(chainJointBuilder())
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
    keyController.keyDown(event);
    currentController.keyPressed();
}

function keyUp (event) {
    keyController.keyUp(event);
}

function propertiesObject(selectedObject) {

    if (selectedObject) {        // если там было тело


        var shapeObject = selectedObject.GetFixtureList().GetShape().GetType();
        switch (shapeObject) {
            case 0:  document.getElementById('properties_object_shape').value = "Снаряд"; break;
            case 1:  document.getElementById('properties_object_shape').value = "Ящик";   break;
            default:
                document.getElementById('properties_object_shape').value = "нет данных"; break;
        }

        var typeObject = selectedObject.GetType();
        switch (typeObject){
            case 0:  document.getElementById('properties_object_type')[1].selected = true; break;
            case 2:  document.getElementById('properties_object_type')[2].selected = true;   break;
            case 1:  document.getElementById('properties_object_type')[3].selected = true; break;
            default:
                document.getElementById('properties_object_type')[0].selected = true; break;
        }

         if(shapeObject == 0){        // если круг
          var radiusObject = selectedObject.GetFixtureList().GetShape().GetRadius();
          document.getElementById('box_properties').style.display = "none";
          document.getElementById('ball_properties').style.display = "block";
          document.getElementById('properties_object_radius').value = Math.floor(radiusObject*10)/10;                  
        }

        if(shapeObject == 1){ // если прямоугольник
          var v = selectedObject.GetFixtureList().GetShape().GetVertices();
          document.getElementById('ball_properties').style.display = "none";
          document.getElementById('box_properties').style.display = "block";
          document.getElementById('properties_object_width').value = Math.floor(Math.abs(v[0].x-v[1].x)*10)/10;
          document.getElementById('properties_object_height').value =  Math.floor(Math.abs(v[2].y-v[1].y)*10)/10;
        }

        // выводим в "Свойства объекта" св-ва выделенного объекта
        document.getElementById('properties_object_density').value = selectedObject.GetFixtureList().GetDensity();
        document.getElementById('properties_object_restitution').value = selectedObject.GetFixtureList().GetRestitution();
        document.getElementById('properties_object_friction').value = selectedObject.GetFixtureList().GetFriction();
        //для угла поворота
        document.getElementById('properties_object_gradus').value = toDegrees(selectedObject.GetAngle());

        selectedObject.SetAwake(true);        // будим тело
    }
	else{  //не выделено тело

       	document.getElementById('properties_object_shape').value = "";

       	document.getElementById('properties_object_type')[0].selected = true;

      	document.getElementById('properties_object_radius').value = "";
      	document.getElementById('properties_object_width').value = "";
       	document.getElementById('properties_object_height').value = "";

        // выводим в "Свойства объекта" св-ва выделенного объекта
        document.getElementById('properties_object_density').value = "";
        document.getElementById('properties_object_restitution').value = "";
        document.getElementById('properties_object_friction').value = "";
        //для угла поворота
        document.getElementById('properties_object_gradus').value = "";

    }
}

function updateObjectProperties() {	// обновить свойства выделенного объекта
    
    if (selectionController.selectedBodies.length == 1) {		// есть выделенное тело
        var selectedObject = selectionController.selectedBodies[0];
        var f = selectedObject.GetFixtureList();
        f.SetDensity(document.getElementById('properties_object_density').value);
        f.SetRestitution(document.getElementById('properties_object_restitution').value);
        f.SetFriction(document.getElementById('properties_object_friction').value);

		switch (document.getElementById('properties_object_type').options.selectedIndex) {
            case 1:  selectedObject.SetType(b2Body.b2_staticBody); break;
            case 2:  selectedObject.SetType(b2Body.b2_dynamicBody); break;
            case 3:  selectedObject.SetType(b2Body.b2_kinematicBody); break;
        }
        selectedObject.SetAwake(true);		// будим выделенное тело (чтобы сразу узреть изменения)
    }
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

    updateObjectProperties();

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