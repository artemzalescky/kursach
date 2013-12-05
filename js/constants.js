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
    , b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef
    , b2WeldJointDef = Box2D.Dynamics.Joints.b2WeldJointDef
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
var painter;

var canvas;		//объект canvas (форма в html)
var CANVAS_WIDTH;	// размеры формы, где рисуем (canvas)
var CANVAS_HEIGHT;

var world;	// объект мира
var worldActivated = true; // запущен процесс симуляции
var ground;	// тело земли
