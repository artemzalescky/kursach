// обработчики событий и состояний 

var mousePressed = false;	// нажата ли кнопка мыши
var mouseJoint = false;		// хранит соединение с мышью
var selectedObjectBuilder = undefined;      // текущий строитель объектов

var arr = [];
var i = 0; 


function mouseDown(event) {		// обработчик нажатия мыши
    event.preventDefault();     // отменить обычное действие события
	mousePressed = true;		// флажок, что кликнули
	var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
	
	if(getObjectType()=="object_joint") //если выбрали соединение
	{
		var body = getBodyAtPoint(cursorPoint); // получаем тело фигуры, которая находится там где кликнули
	
		if(body) // если тело там было
		{
			i++;
			arr.push(body); //добавляем в массив объект
			//arr.push(cursorPoint);
			if(i == 2) //если добавили два объекта, то делаем между ними соединение
			{
				create_joint(arr); //функция создания соединения
				i = 0;
			}		
		}
	} else if(mouseJoint == false && getObjectType() == "object_cursor"){	// если нет соединения с курсором и мы не выбрали добавление объекта
		event.preventDefault();
		var body = getBodyAtPoint(cursorPoint);		// получаем тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)

        if(body) {	// если там было тело
            var def = new b2MouseJointDef();	// создаем соединение между курсором и этим телом
            def.bodyA = ground;
            def.bodyB = body;
            def.target = cursorPoint;
            def.collideConnected = true;
            def.maxForce = 10000 * body.GetMass();
            def.dampingRatio = 0;

            mouseJoint = world.CreateJoint(def);	// доб. соединение к миру

            body.SetAwake(true);	// будим тело
        }
    } else if(selectedObjectBuilder) {
        selectedObjectBuilder.creationController.mouseDown(cursorPoint);
    }
};

function mouseUp() {	// обработчик "отжатия" мыши
    mousePressed = false;	// флажок на "отжат"

    if (mouseJoint) {	// если курсор был соединен с телом
        world.DestroyJoint(mouseJoint);	// уничтожаем соединение
        mouseJoint = false;
    } else if(selectedObjectBuilder) {
        var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// точка, куда нажали
        selectedObjectBuilder.creationController.mouseUp(cursorPoint);
    }
}

function mouseMove(event) {		// обработчик движения курсора
    if (mouseJoint) {		// если есть соединение с курсором
        var cursorPoint = new b2Vec2(toMeters(event.offsetX), toMeters(event.offsetY));		// коорд. курсора
        mouseJoint.SetTarget(cursorPoint);	 // уст. новую точку курсора
    }
}

// обработчик нажатия клавиш
function keyPressed(event) {
    if(event.which === KEY_CODE.ENTER) {
        // не все контроллеры обрабатывают нажатие клавиши enter
        if(selectedObjectBuilder.creationController.enterPressed) {
            selectedObjectBuilder.creationController.enterPressed();
        }
    }
}

function getObjectType() {		// возвращает тип выбранного объекта из формы
    return $('#add_object_select').val();
}

function getBodyAtPoint(point, includeStatic) {		// тело фигуры, находящееся в той точке, куда кликнули (или null, если там пусто)
    var aabb = new b2AABB();		// созд. область, где ищем тело
    aabb.lowerBound.Set(point.x - 0.001, point.y - 0.001);
    aabb.upperBound.Set(point.x + 0.001, point.y + 0.001);

    var body = null;

    function GetBodyCallback(fixture) {	// для перекрывающихся тел
        var shape = fixture.GetShape();

        if (fixture.GetBody().GetType() != includeStatic) {
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
function inputDataChanged(event){
    // проверяем попадание в диапазон значений только для числовых инпутов
    if(event.target.type === 'number') {
        checkInputValueRange(event.target);
    }

    // устанавливаем строитель объектов
    if(event.target.id === 'add_object_select') {
        objectType = getObjectType();
        switch(objectType) {
            case 'object_ball':
            case 'object_box':
            case 'object_poly':
                selectedObjectBuilder = BUILDERS[objectType];
        }
    }
}

function checkInputValueRange(input_object){
    // проверка на выход за предельные значения
    if(parseFloat(input_object.value) < parseFloat(input_object.min)){
        input_object.value = input_object.min;
    } else if(parseFloat(input_object.value) > parseFloat(input_object.max)){
        input_object.value = input_object.max;
    }
}

function create_joint(arr) { // создание соединения между двумя объектами
	//var cursorPoint1 = arr.pop();
	var body1 = arr.pop();
	//var cursorPoint2 = arr.pop();
	var body2 = arr.pop();
			
	var def = new Box2D.Dynamics.Joints.b2DistanceJointDef();
		def.Initialize(body2,
		body1,
		body2.GetWorldCenter(),
		body1.GetWorldCenter());
		def.length = 5;
		def.collideConnected = true;
		world.CreateJoint(def);
		body1.SetAwake(true);  //будим тело 1
		body2.SetAwake(true);  //будим тело 2
}