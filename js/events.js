
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

function setObjectType(value) {  // устанавливает тип выбранного объекта из формы
    return $('#add_object_select').val(value);
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
function addBodyForJoint(cursorPoint)
{
	var body = getBodyAtPoint(cursorPoint,true); // получаем тело фигуры, которая находится там где кликнули
		var jointType = getJointType();	// что мы выбрали в форме соединения
		if(body) // если тело там было
		{
			i++;
			arr.push(body); //добавляем в массив объект
			if(i == 2 && jointType != 'joint_gear' ) //если добавили два объекта, то делаем между ними соединение
			{
				if(arr[0] != arr[1])
				create_joint(arr); //функция создания соединения
				else
				{
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

	if(jointType == 'joint_gear') {
		var body4 = arr.pop();
		var body3 = arr.pop();
		var body2 = arr.pop();
		var body1 = arr.pop();
	}
	else {
		var body2 = arr.pop();
		var body1 = arr.pop();
	}
			
	if(jointType == 'joint_distance')
		create_distance_joint(body1, body2);
	if(jointType == 'joint_revolute')
		create_revolute_joint(body1, body2);
	if(jointType == 'joint_prismatic')
		create_prismatic_joint(body1, body2);
	if(jointType == 'joint_pulley')
		create_pulley_joint(body1, body2);
	if(jointType == 'joint_gear')
		create_gear_joint(body1, body2, body3, body4);
		
}
function create_pulley_joint(body1, body2){

	var anchor1 = body1.GetWorldCenter();
	var anchor2 = body2.GetWorldCenter();
	 
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
	
	var jointRevolute = new b2RevoluteJointDef();
	jointRevolute.Initialize(body1, body2, body1.GetWorldCenter());   
	jointRevolute.enableMotor = true;
	jointRevolute.motorSpeed = 1;
    jointRevolute.maxMotorTorque = 20;
	var joint1 = this.world.CreateJoint(jointRevolute);
	
	var jointRevolute2 = new b2RevoluteJointDef();
	jointRevolute2.Initialize(body3, body4, body3.GetWorldCenter());   
	jointRevolute2.enableMotor = true;
	jointRevolute2.motorSpeed = -10;
    jointRevolute2.maxMotorTorque = 30;
	
	var joint2 = this.world.CreateJoint(jointRevolute2);
	
	var gearJointDef = new b2GearJointDef();
		gearJointDef.bodyA = body2;
        gearJointDef.bodyA = body4;
        gearJointDef.joint1 = joint1;
        gearJointDef.joint2 = joint2;
        gearJointDef.collideConnected = true;
        gearJointDef.ratio = 0.2;
		
	world.CreateJoint(gearJointDef);
}

function create_prismatic_joint(body1, body2) {

	var joint = new b2PrismaticJointDef();
    joint.Initialize(body1, body2, body1.GetWorldCenter(),new b2Vec2(1,0));
    joint.lowerTranslation=-5;
    joint.upperTranslation=5
    joint.enableLimit=true;
    joint.maxMotorForce=100;
    joint.motorSpeed=5.0;
    joint.enableMotor=true;
	this.world.CreateJoint(joint);
}

function create_revolute_joint(body1, body2) {
	var joint = new b2RevoluteJointDef();
    joint.Initialize(body1, body2, body1.GetWorldCenter());
	joint.enableMotor = true;
	joint.motorSpeed = 7;
    joint.maxMotorTorque = 20;
	this.world.CreateJoint(joint);
}

function create_distance_joint(body1, body2) {
	var def = new Box2D.Dynamics.Joints.b2DistanceJointDef();
	def.Initialize(body1, body2, body1.GetWorldCenter(), body2.GetWorldCenter());
	def.length = document.getElementById('joint_length').value;
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