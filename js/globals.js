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

var canvas;		//объект canvas (форма в html)
var CANVAS_WIDTH;	// размеры формы, где рисуем (canvas)
var CANVAS_HEIGHT;

var world;	// объект мира
var worldActivated = true; // запущен процесс симуляции
var ground;	// тело земли

var BODY_TYPES = {
    'static_body': b2Body.b2_staticBody,
    'dynamic_body': b2Body.b2_dynamicBody,
    'kinematic_body': b2Body.b2_kinematicBody
}

// константы для клавиш, берутся из event.which
var KEY_CODE = {
    ENTER: 13
}

var COLORS = {
    SELECTED_SHAPE: new b2Color(1, 1, 0),
    CONTOUR_SHAPE: new b2Color(0, 1, 0),
    SELECTED_AREA: new b2Color(0, 0, 0.8)
}

// дефенишены для границ мира
WORLD_BOUND_FIX_DEF = new b2FixtureDef;
WORLD_BOUND_FIX_DEF.density = 0.5;
WORLD_BOUND_FIX_DEF.friction = 0.3;
WORLD_BOUND_FIX_DEF.restitution = 0.5;

WORLD_BOUND_BODY_DEF = new b2BodyDef;
WORLD_BOUND_BODY_DEF.type = BODY_TYPES['static_body'];

// толщина границ мира
WORLD_BOUND_THICKNESS = 1;