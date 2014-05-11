function saveJSON(){
    var masObject=[];   //массив объектов
    var masJoint=[];    //массив в котором будут храниться соединения

    for(var currentBody = world.GetBodyList(); currentBody; currentBody = currentBody.GetNext()){

        var obj = getSimpleObject(currentBody);
        //alert(JSON.stringify(obj));
        console.log(obj);
    }
}

function getSimpleObject(body){
    var res = {};

    res.type = body.GetType();                       //динамическое, статическое или ... тело
    res.angle = body.GetAngle();

    res.x = body.GetPosition().x;
    res.y = body.GetPosition().y;

    res.angleVelocity = body.GetAngularVelocity();   //угловая скорость
    res.mass = body.GetMass();                      //масса

    if (body.GetFixtureList()){

      res.density = body.GetFixtureList().GetDensity();          // плотность
      res.friction = body.GetFixtureList().GetFriction();        // трение
      res.restitution = body.GetFixtureList().GetRestitution();  // упругость

      res.shape = body.GetFixtureList().GetShape().GetType();              // получить форму тела
      res.isSensor = body.GetFixtureList().IsSensor();           // no-solid???
    }

    return res;
}

function logObject(obj, level, name) { // level - уровень вложенности подобъекта
    level = level || 0;

    var space = ' ';
    var tab = '';
    for(var i = 0; i < level; i++)
        tab += space;

    if (name != undefined)
        console.log(tab + name + '[object] = {');
    else
        console.log(tab + '{');

    for (var key in obj) {
        if (typeof(obj[key]) != 'object')
            console.log(tab + space + key + '[' + typeof(obj[key]) + '] = ' + obj[key]);
        else
            logObject(obj[key], level + 1, key);
    }

    console.log(tab + '}');
}
