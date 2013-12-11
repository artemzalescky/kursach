
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
       	addBodyForJoint(cursorPoint);
    } else if (getActionType() == "action_delete" & getObjectType() == "object_cursor") { //если выбрали удаление
        var body = getBodyAtPoint(cursorPoint, true); // получаем тело фигуры, которая находится там где кликнули

        if (body) { // если тело там было
            world.DestroyBody(body);
        }
    } else if (mouseJoint == false && getObjectType() == "object_cursor" & getActionType() == "action_drag") {	// если нет соединения с курсором и мы не выбрали добавление объекта

        GetPropertyObject(cursorPoint);
        
    } else if (selectedObjectBuilder) {
        selectedObjectBuilder.creationController.mouseDown(cursorPoint);
    }
};

//определение свойств объекта
function GetPropertyObject(cursorPoint){

    selectedObject = getBodyAtPoint(cursorPoint, true);		// получаем тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)

    if (selectedObject) {	// если там было тело

		var shapeObject = document.getElementById('created_object_shape').value = selectedObject.GetFixtureList().GetShape().GetType();
        switch (shapeObject) {
            case 0:  document.getElementById('created_object_shape').value = "Снаряд"; break;
            case 1:  document.getElementById('created_object_shape').value = "Ящик";   break;
            default:
                document.getElementById('created_object_shape').value = "нет данных"; break;
        }

        var typeObject = selectedObject.GetType();
        switch (typeObject){
            case 0:  document.getElementById('created_object_type').value = "static_body"; break;
            case 1:  document.getElementById('created_object_type').value = "kinematic_body";   break;
            case 2:  document.getElementById('created_object_type').value = "dynamic_body"; break;
            default:
                document.getElementById('created_object_type').value = "нет данных"; break;
        }

		if(shapeObject == 0){	// если круг
			var radiusObject = selectedObject.GetFixtureList().GetShape().GetRadius();
			document.getElementById('created_object_radius').value = Math.floor(radiusObject*10)/10;
            document.getElementById('created_object_width').value = "";
            document.getElementById('created_object_height').value = "";
		}

        if(shapeObject == 1){ // если прямоугольник
            var v = selectedObject.GetFixtureList().GetShape().GetVertices();
            document.getElementById('created_object_radius').value = "";
            document.getElementById('created_object_width').value = Math.floor(Math.abs(v[0].x-v[1].x)*10)/10;
            document.getElementById('created_object_height').value =  Math.floor(Math.abs(v[2].y-v[1].y)*10)/10;
        }


        /*
		 //определить твёрдое тело или нет
		if( selectedObject.GetFixtureList().IsSensor() )
			document.getElementById('created_object_is_sensor').value = "body_is_no_sensor";
		else
			document.getElementById('created_object_is_sensor').value = "body_is_sensor";
        */
		
        // выводим в "Свойства объекта" св-ва выделенного объекта
        document.getElementById('created_object_density').value = selectedObject.GetFixtureList().GetDensity();
        document.getElementById('created_object_restitution').value = selectedObject.GetFixtureList().GetRestitution();
        document.getElementById('created_object_friction').value = selectedObject.GetFixtureList().GetFriction();
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
}

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
																			// && fixture.IsSensor() == false
        if ((fixture.GetBody().GetType() != b2Body.b2_staticBody || includeStatic) ) { // сенсоры не выделяются (чтоб тело в воде можно было выделить)
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
    if (event.target.id !== 'add_object_select') {
    } else {
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
function addBodyForJoint(cursorPoint)
{
	var body = getBodyAtPoint(cursorPoint,true); // получаем тело фигуры, которая находится там где кликнули
		var jointType = getJointType();	// что мы выбрали в форме соединения
		if(body) // если тело там было
		{
			i++;
			arr.push(body); //добавляем в массив объект
			arr.push(cursorPoint);
			if(i == 2 && jointType != 'joint_gear' ) //если добавили два объекта, то делаем между ними соединение
			{
				if(arr[0] != arr[2])
				create_joint(arr); //функция создания соединения
				else
				{
					arr.pop();
					arr.pop();
					arr.pop();
					arr.pop();
				}
				i = 0;
			}
			else if(i == 4 && jointType == 'joint_gear' ) { //если добавили четыре объекта, то делаем между ними соединение
				create_joint(arr);
				i = 0;
			}
		}
}

function create_joint(arr) { // создание соединения между двумя объектами

 var jointType = getJointType();	// что мы выбрали в форме соединения	

	if(jointType == 'joint_distance')
		create_distance_joint(arr);
	if(jointType == 'joint_revolute')
		create_revolute_joint(arr);
	if(jointType == 'joint_prismatic')
		create_prismatic_joint(arr);
	if(jointType == 'joint_pulley')
		create_pulley_joint(arr);
	if(jointType == 'joint_gear')
		create_gear_joint(arr);
		
}
function create_pulley_joint(arr){

	var cursorPoint2 = arr.pop();
	var body2 = arr.pop();
	var cursorPoint1 = arr.pop();
	var body1 = arr.pop();
	if(($('#object_center').is(":checked"))) {
		var anchor1 = body1.GetWorldCenter();
		var anchor2 = body2.GetWorldCenter();
	}
	else {
		var anchor1 = cursorPoint1;
		var anchor2 = cursorPoint2;
	}
	 
	var groundAnchor1 = new b2Vec2(anchor1.x, anchor1.y - (300 / SCALE)); 
	var groundAnchor2 = new b2Vec2(anchor2.x, anchor2.y - (300 / SCALE));
	 
	var ratio = 0.8;
	 
	var pulleyJointDef = new b2PulleyJointDef();
	pulleyJointDef.Initialize(body1, body2, groundAnchor1, groundAnchor2, anchor1, anchor2, ratio);
	pulleyJointDef.maxLengthA = 600 / SCALE;
	pulleyJointDef.maxLengthB = 600 / SCALE;
	 
	world.CreateJoint(pulleyJointDef);
}

function create_gear_joint(body1, body2, body3, body4) { //нужно 4 объекта, сначала по два связываются revolute, а потом эти два связываются gear
	
	var cursorPoint4 = arr.pop();
	var body4 = arr.pop();
	var cursorPoint3 = arr.pop();
	var body3 = arr.pop();
	var cursorPoint2 = arr.pop();
	var body2 = arr.pop();
	var cursorPoint1 = arr.pop();
	var body1 = arr.pop();
	
	var jointRevolute = new b2RevoluteJointDef();
	if(($('#object_center').is(":checked"))) {
	    jointRevolute.Initialize(body1, body2, body1.GetWorldCenter());
	}
	else {
		 jointRevolute.Initialize(body1, body2, cursorPoint1);
	}
	jointRevolute.enableMotor = true;
	jointRevolute.motorSpeed = 1;
    jointRevolute.maxMotorTorque = 20;
	var joint1 = this.world.CreateJoint(jointRevolute);
	
	var jointRevolute2 = new b2RevoluteJointDef();
	if(($('#object_center').is(":checked"))) {
	    jointRevolute2.Initialize(body3, body4, body3.GetWorldCenter());
	}
	else {
		 jointRevolute2.Initialize(body3, body4, cursorPoint3);
	}
	jointRevolute2.enableMotor = true;
	jointRevolute2.motorSpeed = -10;
    jointRevolute2.maxMotorTorque = 30;
	
	var joint2 = this.world.CreateJoint(jointRevolute2);
	
	var gearJointDef = new b2GearJointDef();
		gearJointDef.bodyA = body2;
        gearJointDef.bodyB = body4;
        gearJointDef.joint1 = joint1;
        gearJointDef.joint2 = joint2;
        gearJointDef.collideConnected = true;
        gearJointDef.ratio = 0.2;
		
	world.CreateJoint(gearJointDef);
}

function create_prismatic_joint(arr) {

	var cursorPoint2 = arr.pop();
	var body2 = arr.pop();
	var cursorPoint1 = arr.pop();
	var body1 = arr.pop();
	
	var joint = new b2PrismaticJointDef();
	if(($('#object_center').is(":checked"))) {
			joint.Initialize(body1, body2, body1.GetWorldCenter(), new b2Vec2(1,0));
	}
	else {
		joint.Initialize(body1, body2, cursorPoint1 ,new b2Vec2(1,0));
	}
    joint.lowerTranslation=-5;
    joint.upperTranslation=5
    joint.enableLimit=true;
    joint.maxMotorForce=100;
    joint.motorSpeed=5.0;
    joint.enableMotor=true;
	this.world.CreateJoint(joint);
}

function create_revolute_joint(arr) {
	var cursorPoint2 = arr.pop();
	var body2 = arr.pop();
	var cursorPoint1 = arr.pop();
	var body1 = arr.pop();
	
	var joint = new b2RevoluteJointDef();
	if(($('#object_center').is(":checked"))) {
	    joint.Initialize(body1, body2, body1.GetWorldCenter());
	}
	else {
		 joint.Initialize(body1, body2, cursorPoint1);
	}
	joint.enableMotor = true;
	joint.motorSpeed = 7;
    joint.maxMotorTorque = 20;
	this.world.CreateJoint(joint);
}

function create_distance_joint(arr) {
	var cursorPoint2 = arr.pop();
	var body2 = arr.pop();
	var cursorPoint1 = arr.pop();
	var body1 = arr.pop();
		
	var def = new Box2D.Dynamics.Joints.b2DistanceJointDef();
	
	if(($('#object_center').is(":checked"))) {
	
		def.Initialize(body1, body2, body1.GetWorldCenter(), body2.GetWorldCenter());
	}
	else {
		
		def.Initialize(body1, body2, cursorPoint1, cursorPoint2);
	}
	
	def.length = document.getElementById('joint_length').value;
	def.collideConnected = true;
	world.CreateJoint(def);
  
}

function pauseButtonEvent(event) {
    worldActivated = !worldActivated;
    for (var shape = world.GetBodyList(); shape; shape = shape.GetNext()) {
        shape.SetActive(worldActivated);
    }
}

//очитска всех элементов
function RestartButtonEvent(event) {   
       for (var body = world.GetBodyList(); body; body = body.GetNext()) {
           world.DestroyBody(body);
    }
    setWorldBounds(); //пересоздать границу
}