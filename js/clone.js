/**
 * Created by РыЖыК
 */

function clone()
{
    var saveObjects = copy();
    paste(saveObjects);
}

function copy()
{
    var masObject=[];   //массив объектов
    var saveObjects = [];  //массив сохраненых в буфер объектов
    //найдем выделенное тело и запишем в masObject

    for(var i = 0; i < selectionController.selectedBodies.length; i++)
    {
        var obj = getSimpleObject(selectionController.selectedBodies[i]);
        saveObjects.push(obj);
    }
    return saveObjects;
}
function paste(bodies)
{
    for (var i = 0; i < bodies.length; i++)
    {
        createObject(bodies[i]);
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
        res.sizeX = body.GetFixtureList().GetAABB().GetExtents().x;
        res.sizeY = body.GetFixtureList().GetAABB().GetExtents().y;
    }
    alert(res);
    return res;
}

function createObject(obj)
{
    var fixDef = new b2FixtureDef;
    fixDef.density = obj.density;                // плотность
    fixDef.friction = obj.friction;                // коэфициент трения
    fixDef.restitution = obj.restitution;        // коэффицент упругости
    fixDef.isSensor = obj.isSensor;             // если isSensor == False, тело твердое

    var bodyDef = new b2BodyDef;
    bodyDef.type = obj.type;                // тип тела (static, dynamic, kinematic)
    bodyDef.active = worldActivated;

    if (obj.shape == 0)
    { //создаём снаряд
        var points = [new b2Vec2(obj.x,obj.y), new b2Vec2(obj.x + obj.sizeX / Math.sqrt(2),obj.y + obj.sizeY / Math.sqrt(2))];
        return BallBuilder().build(points,fixDef,bodyDef);
    }
    else if (obj.shape == 1 )
    { //создаем ящик
        var points = [new b2Vec2(obj.x - obj.sizeX,obj.y - obj.sizeY), new b2Vec2(obj.x + obj.sizeX, obj.y + obj.sizeY)];
        return BoxBuilder().build(points,fixDef,bodyDef);
    }
}