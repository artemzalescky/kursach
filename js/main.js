 var b2Vec2 = Box2D.Common.Math.b2Vec2			// просто сокращения названий
	, b2AABB = Box2D.Collision.b2AABB
	, b2BodyDef = Box2D.Dynamics.b2BodyDef
	, b2Body = Box2D.Dynamics.b2Body
	, b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	, b2Fixture = Box2D.Dynamics.b2Fixture
	, b2World = Box2D.Dynamics.b2World
	, b2MassData = Box2D.Collision.Shapes.b2MassData
	, b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	, b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	, b2DebugDraw = Box2D.Dynamics.b2DebugDraw
	, b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
	, b2WeldJointDef =  Box2D.Dynamics.Joints.b2WeldJointDef
	, b2Shape = Box2D.Collision.Shapes.b2Shape
	, b2Joint = Box2D.Dynamics.Joints.b2Joint
	, b2Settings = Box2D.Common.b2Settings
	, b2ContactFilter = Box2D.Dynamics.b2ContactFilter
	, b2BuoyancyController = Box2D.Dynamics.Controllers.b2BuoyancyController
	, b2Color = Box2D.Common.b2Color;


var FPS = 60; 	// отрисовка (кадров в секунду)
var SCALE = 30;  // пикселей в метре

var buoyancyController;	// контроллер плавучести
var debugDraw;			// отрисовщик


var canvas;		//объект canvas (форма в html)
var CANVAS_WIDTH;	// размеры формы, где рисуем (canvas)
var CANVAS_HEIGHT;

var world;	// объект мира
var ground;	// тело земли


	function init(){		// вызывается  при загрузке страницы (основная функция)
	
		// настраиваем форму, где рисуем
		canvas = $('#canvas');	// элемент по id (из jquery) 
		CANVAS_WIDTH = parseInt(canvas.attr('width'));		// делаем расстояния границ мира по размерам canvas
		CANVAS_HEIGHT = parseInt(canvas.attr('height'));

		setupPhysics();								// настраивает физику опыта
		setupDebugDraw();							// настраиваем debug draw (стандартный отрисовщик)
		window.setInterval(update, 1000 / FPS);		// интервал обновления
		setupBuoyancyController();					// настраиваем контроллер плавучести
		
		// добавляем обработчики событий
		canvas.on('click', canvasClicked);
		canvas.mousedown(mouseDown);	// canvas.mousedown - событие, при клике по canvas;  mouseDown(event) - обработчик события
		canvas.mouseup(mouseUp);
		canvas.mousemove(mouseMove);
	}
	  
	function setupPhysics(){		// настраивает физику опыта 

		var gravity = new b2Vec2(0,20);				// вектор силы тяжести
		var allowSleeping = true;					// разрешаем телам засыпать
		world = new b2World(gravity,allowSleeping);	// создаем мир
         
		setBounds();	// устанавливаем границы мира
		
		createPool(475,500,700,200);
		addBox(400,300,60,60);
	}
	  
	function setBounds(){		// установить границы мира
		ground = addBox( CANVAS_WIDTH / 2, CANVAS_HEIGHT, CANVAS_WIDTH, 2, true);	// создаем землю
		addBox( CANVAS_WIDTH / 2, 0, CANVAS_WIDTH, 2, true);						// потолок
		addBox( 0 , CANVAS_HEIGHT / 2, 2, CANVAS_HEIGHT, true);						// стены
		addBox( CANVAS_WIDTH , CANVAS_HEIGHT / 2, 2, CANVAS_HEIGHT, true);
	}
		
	function experiment2(){		// мячики на нитках
		var body1 = addBox(500,100,300,1,true);		// планка
		var body2 = addBall(440,350,30);
		var body3 = addBall(500,350,30);
		var body4 = addBall(560,350,30);
		
		var def = new Box2D.Dynamics.Joints.b2DistanceJointDef();
		def.Initialize(body1,
		body2,
		new b2Vec2(body1.GetWorldCenter().x-2,body1.GetWorldCenter().y),
		body2.GetWorldCenter());
		var joint = world.CreateJoint(def);

		def.Initialize(body1,
		body3,
		new b2Vec2(body1.GetWorldCenter().x,body1.GetWorldCenter().y),
		body3.GetWorldCenter());
		world.CreateJoint(def);
		
		def.Initialize(body1,
		body4,
		new b2Vec2(body1.GetWorldCenter().x+2,body1.GetWorldCenter().y),
		body4.GetWorldCenter());
		world.CreateJoint(def);
		
		def.Initialize(body1,
		body3,
		new b2Vec2(body1.GetWorldCenter().x,body1.GetWorldCenter().y),
		body3.GetWorldCenter());
		world.CreateJoint(def);
	}

	function updateGravitation(){	// обновить гравитацию
		world.GetGravity().Set(0,2*document.getElementById('world_gravity').value);	// вектор гравитации
		wakeAllBodies();		// будим все тела, чтоб сразу обновилась картинка
	}
	
	function setupBuoyancyController(){	// настраиваем контроллер плавучести
		buoyancyController = new b2BuoyancyController();
	
		buoyancyController.normal.Set(0,-1);	// вектор нормали поверхности воды
		buoyancyController.offset=-400/SCALE;	// высота жидкости вдоль нормали
		buoyancyController.useDensity=true;		// используем плотность жидкости
		buoyancyController.density=1;			// плотность
		buoyancyController.linearDrag=2;		// линейное торможение
		buoyancyController.angularDrag=1;		// угловое торможение
		
		world.AddController(buoyancyController); // добавляем контроллер
	}
	
	function updateWaterProperties(){	// обновить свойства воды
		checkValues();		// проверить корректность введенных значений
	
		buoyancyController.density = document.getElementById('water_density').value;		// обновляем плотность
		buoyancyController.linearDrag = 2*document.getElementById('water_drag').value;		// линейное торможение
		buoyancyController.angularDrag = document.getElementById('water_drag').value;		// угловое торможение
		
		wakeAllBodies();		// будим все тела, чтоб сразу обновилась картинка
	}
	
	function checkValues(){		// проверить корректность введенных значений (должны лежать внутри интервалла)
		if(parseInt(document.getElementById('water_density').value) < parseInt(document.getElementById('water_density').min))	// проверка на выход за предельные значения
			document.getElementById('water_density').value = document.getElementById('water_density').min;
		if(parseInt(document.getElementById('water_density').value) > parseInt(document.getElementById('water_density').max))
			document.getElementById('water_density').value = document.getElementById('water_density').max;
		if(parseInt(document.getElementById('water_drag').value) < parseInt(document.getElementById('water_drag').min))
			document.getElementById('water_drag').value = document.getElementById('water_drag').min;
		if(parseInt(document.getElementById('water_drag').value) > parseInt(document.getElementById('water_drag').max))
			document.getElementById('water_drag').value = document.getElementById('water_drag').max;
	}

	function wakeAllBodies(){	// разбудить все тела (для изменения параметров воды)
		for (var currentBody = world.GetBodyList(); currentBody; currentBody = currentBody.GetNext()){
			currentBody.SetAwake(true);
		}
	}

	function setupDebugDraw(){	// устанавливает настройки для отрисовки
		debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
		debugDraw.SetDrawScale(SCALE);
		debugDraw.SetFillAlpha(0.5);		// коэффициент непрозрачности
		debugDraw.SetLineThickness(1);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit | b2DebugDraw.e_pairBit);	// флаги рисования фигур и соединений
		
		world.SetDebugDraw(debugDraw);	
	}

	function update(){	// обновляем мир
		world.Step(
			1 / FPS   // частота кадров
			,  10       // кол-во итераций по расчету скоростей
			,  10       // кол-во итераций по расчету координат
		);
		
		world.DrawDebugData();	// все рисуем
		
		// обработка касания с водой
		for (var currentBody = world.GetBodyList(); currentBody; currentBody = currentBody.GetNext()){	// идем по всем телам
			if (currentBody.GetType() == b2Body.b2_dynamicBody){	// если тело динамическое
				//debugDraw.DrawSolidCircle(currentBody.GetWorldCenter(), 1, new b2Vec2(0,1), new b2Color(0,0,0));
				var currentBodyControllers = currentBody.GetControllerList();	// получаем список контроллеров данного тела
				
				// по умолчанию тело удаляется из контроллера плавучести (если есть контакт с водой, то в след. цикле добавим)
				if (currentBodyControllers!=null){	// список контроллеров тела не пуст (по сути, там есть наш контроллер плавучести)
					buoyancyController.RemoveBody(currentBody);	// удаляем тело из нашего контроллера 
				}
				
				for (var c = currentBody.GetContactList(); c; c=c.next){	// идем по списку контактов	текущего тела	
					var contact=c.contact;
					var fixtureA=contact.GetFixtureA();		// в контакте присутствуют 2 тела (А,В)
					var fixtureB=contact.GetFixtureB();

					if (fixtureA.IsSensor()) {		// если тело А - сенсор (т.е. вода)
						var bodyB=fixtureB.GetBody();	// тело, к которому прикреплена фигура (то, что касается с водой)
						var bodyBControllers=bodyB.GetControllerList();	// список контроллеров этого тела
						if (bodyBControllers==null) {	// если нет обработчиков
							buoyancyController.AddBody(bodyB);	// добавляем тело в контроллер плавучести
						}
					}
					if (fixtureB.IsSensor()) {		// -//- пред. только А меняем на В (не знаем, которое тело будет водой, A или В)
						var bodyA=fixtureA.GetBody();
						var bodyAControllers=bodyA.GetControllerList();
						if (bodyAControllers==null) {
							buoyancyController.AddBody(bodyA);
						}
					}
				}
			}
        }
		
		world.ClearForces();	// обнуляем силы
	}