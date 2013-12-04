var buoyancyController;	// контроллер плавучести
var debugDraw;			// отрисовщик


var canvas;		//объект canvas (форма в html)
var CANVAS_WIDTH;	// размеры формы, где рисуем (canvas)
var CANVAS_HEIGHT;

var world;	// объект мира
var ground;	// тело земли


function toMeters(pixels) {		// перевод из пикселей в метры
    return pixels / SCALE;
}


function init() {		// вызывается  при загрузке страницы (основная функция)
    // настраиваем форму, где рисуем
    canvas = $('#canvas');	// элемент по id (из jquery)
    CANVAS_WIDTH = parseInt(canvas.attr('width'));		// делаем расстояния границ мира по размерам canvas
    CANVAS_HEIGHT = parseInt(canvas.attr('height'));

    setupPhysics();								// настраивает физику опыта
    setupDebugDraw();							// настраиваем debug draw (стандартный отрисовщик)
    window.setInterval(update, 1000 / FPS);		// интервал обновления
    setupBuoyancyController();					// настраиваем контроллер плавучести

    // добавляем обработчики событий
    canvas.mousedown(mouseDown);	// canvas.mousedown - событие, при клике по canvas;  mouseDown(event) - обработчик события
    canvas.mouseup(mouseUp);
    canvas.mousemove(mouseMove);

    $('body').keypress(keyPressed); // отлавливание событий нажатия клавиш
    $('#select_list').change(inputDataChanged);
}

function setupPhysics() {		// настраивает физику опыта
    var gravity = new b2Vec2(0, 20);				// вектор силы тяжести
    var allowSleeping = true;					// разрешаем телам засыпать
    world = new b2World(gravity, allowSleeping);	// создаем мир

    setWorldBounds();	// устанавливаем границы мира
}

function setWorldBounds() {		// установить границы мира
    ground = createWorldBound(0, CANVAS_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT);	// создаем землю
    createWorldBound(0, 0, CANVAS_WIDTH, 0);						// потолок
    createWorldBound(0, 0, 0, CANVAS_HEIGHT);						// стены
    createWorldBound(CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function createWorldBound(x1, y1, x2, y2) {
    p1 = new b2Vec2(toMeters(x1), toMeters(y1));
    p2 = new b2Vec2(toMeters(x2), toMeters(y2));
    // получаем строитель прямоугольников и создаем границу по двум точкам
    return BUILDERS['object_box'].build([p1, p2], WORLD_BOUND_FIX_DEF, WORLD_BOUND_BODY_DEF);
}

function updateGravitation() {	// обновить гравитацию
    world.GetGravity().Set(0, 2 * document.getElementById('world_gravity').value);	// вектор гравитации
    wakeAllBodies();		// будим все тела, чтоб сразу обновилась картинка
}

function setupBuoyancyController() {	// настраиваем контроллер плавучести
    buoyancyController = new b2BuoyancyController();

    buoyancyController.normal.Set(0, -1);	// вектор нормали поверхности воды
    buoyancyController.offset = -400 / SCALE;	// высота жидкости вдоль нормали
    buoyancyController.useDensity = true;		// используем плотность жидкости
    buoyancyController.density = 1;			// плотность
    buoyancyController.linearDrag = 2;		// линейное торможение
    buoyancyController.angularDrag = 1;		// угловое торможение

    world.AddController(buoyancyController); // добавляем контроллер
}

function updateWaterProperties() {	// обновить свойства воды
    buoyancyController.density = document.getElementById('water_density').value;		// обновляем плотность
    buoyancyController.linearDrag = 2 * document.getElementById('water_drag').value;		// линейное торможение
    buoyancyController.angularDrag = document.getElementById('water_drag').value;		// угловое торможение

    wakeAllBodies();		// будим все тела, чтоб сразу обновилась картинка
}

function wakeAllBodies() {	// разбудить все тела (для изменения параметров воды)
    for (var currentBody = world.GetBodyList(); currentBody; currentBody = currentBody.GetNext()) {
        currentBody.SetAwake(true);
    }
}

function setupDebugDraw() {	// устанавливает настройки для отрисовки
    debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
    debugDraw.SetDrawScale(SCALE);
    debugDraw.SetFillAlpha(0.5);		// коэффициент непрозрачности
    debugDraw.SetLineThickness(1);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit | b2DebugDraw.e_pairBit);	// флаги рисования фигур и соединений

    world.SetDebugDraw(debugDraw);
}

function update() {	// обновляем мир
    world.Step(
        1 / FPS   // частота кадров
        , 10       // кол-во итераций по расчету скоростей
        , 10       // кол-во итераций по расчету координат
    );

    world.DrawDebugData();	// все рисуем

    // обработка касания с водой
    for (var currentBody = world.GetBodyList(); currentBody; currentBody = currentBody.GetNext()) {	// идем по всем телам
        if (currentBody.GetType() == b2Body.b2_dynamicBody) {	// если тело динамическое
            //debugDraw.DrawSolidCircle(currentBody.GetWorldCenter(), 1, new b2Vec2(0,1), new b2Color(0,0,0));
            var currentBodyControllers = currentBody.GetControllerList();	// получаем список контроллеров данного тела

            // по умолчанию тело удаляется из контроллера плавучести (если есть контакт с водой, то в след. цикле добавим)
            if (currentBodyControllers != null) {	// список контроллеров тела не пуст (по сути, там есть наш контроллер плавучести)
                buoyancyController.RemoveBody(currentBody);	// удаляем тело из нашего контроллера
            }

            for (var c = currentBody.GetContactList(); c; c = c.next) {	// идем по списку контактов	текущего тела
                var contact = c.contact;
                var fixtureA = contact.GetFixtureA();		// в контакте присутствуют 2 тела (А,В)
                var fixtureB = contact.GetFixtureB();

                if (fixtureA.IsSensor()) {		// если тело А - сенсор (т.е. вода)
                    var bodyB = fixtureB.GetBody();	// тело, к которому прикреплена фигура (то, что касается с водой)
                    var bodyBControllers = bodyB.GetControllerList();	// список контроллеров этого тела
                    if (bodyBControllers == null) {	// если нет обработчиков
                        buoyancyController.AddBody(bodyB);	// добавляем тело в контроллер плавучести
                    }
                }
                if (fixtureB.IsSensor()) {		// -//- пред. только А меняем на В (не знаем, которое тело будет водой, A или В)
                    var bodyA = fixtureA.GetBody();
                    var bodyAControllers = bodyA.GetControllerList();
                    if (bodyAControllers == null) {
                        buoyancyController.AddBody(bodyA);
                    }
                }
            }
        }
    }

    world.ClearForces();	// обнуляем силы
}