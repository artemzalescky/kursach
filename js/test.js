test('getObjectType()', function () {
  ok(getObjectType() === 'object_box', 'Проверка функции просмотра выбранного объекта');
});

test('getActionType()', function () {
  ok(getActionType() === 'action_drag', 'Проверка функции просмотра действия курсора');
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


