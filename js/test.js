


test('getObjectType()', function () {
  ok(getObjectType() === 'object_box', 'Проверка функции просмотра выбранного объекта');
});

test('checkInputValueRange()', function () {

  // создаём объект для тестирования
  var obj = new Object();
  obj.value = -10;
  obj.min = 1;
  obj.max = 20;

  // Выполняем функцию для тестирования
  checkInputValueRange(obj);

  ok(obj.value === 1, 'Проверка функции максимального и минимального значения(если значение меньше минимального)');

  obj.value = 5;
  checkInputValueRange(obj);
  ok(obj.value === 5, 'Проверка функции максимального и минимального значения(если значение входит в допустимые значения)');

  obj.value = 50;
  checkInputValueRange(obj);
  ok(obj.value === 20, 'Проверка функции максимального и минимального значения(если значение больше максимального)');


});

test('getBodyAtPoint()', function () {
        ok(createObjectBox() === true, 'Проверка функции определения объекта в точке(создаём объект)');
        ok(deleteObj() === true, 'Проверка функции определения объекта в точке(удаляем объект)');
});

function createObjectBox() { // функция создаёт объект , и проверяет что он создан

    init();
	
    var bodyDef = new b2BodyDef(); // создаём объект     
    fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 1.0;
    fixDef.restitution = 0.5;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(4.00 , .30);
    bodyDef.position.Set(4.10 , 4.70);
    world.CreateBody(bodyDef).CreateFixture(fixDef);
    var cursorPoint = new b2Vec2(4.10, 4.69);
   
    var body = getBodyAtPoint(cursorPoint, true); 
    
    if (body) { // проверяем, что объект существует
          return true;
    }
    return false;
}

function deleteObj(){ //функция удаляет объект, и проверяет что он удалён
    var cursorPoint = new b2Vec2(4.10, 4.69);
    
    var body = getBodyAtPoint(cursorPoint, true); 
    world.DestroyBody(body);
    
    var body = getBodyAtPoint(cursorPoint, true); 
    
    if (body) { // проверяем, что объект удалён
           return false;
    }
    return true;
}


