function JointBuilder (view) {
    var self = {};

    var jointView = view;
    self.REQUIRED_OBJECTS_COUNT = null;

    self.createJoint = function (bodies, points) {
        var jointDef = self._createJointDef(bodies, points);
        var joint = world.CreateJoint(jointDef);
        joint.userData = jointView(joint);

        for (i = 0; i < bodies.length; i++) {
            bodies[i].SetAwake(true);
        }
        return joint;
    };

    self.isValid = function(body, bCount) { throw new Error; }

    self._createJointDef = function () {throw new Error};

    return self;
}

function DistanceJointBuilder () {
    var self = JointBuilder(DistanceJointView);

    self.REQUIRED_OBJECTS_COUNT = 2;

    self._createJointDef = function (bodies, points) {
        var jointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef();
        jointDef.Initialize(
            bodies[1],
            bodies[0],
            points[1],
            points[0]
        );
        jointDef.length = getDistance(points[0], points[1]);
        jointDef.collideConnected = true;
        return jointDef;
    }

    self.isValid = function(body, bCount) {
        return body ? true : false;
    }

    return self;
}

function RevoluteJointBuilder () {
    var self = JointBuilder(RevoluteJointView);

    self.REQUIRED_OBJECTS_COUNT = 3;

    self._createJointDef = function (bodies, points) {
        var jointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        jointDef.Initialize(bodies[0], bodies[1], points[2]);
        jointDef.enableMotor = false;
        jointDef.motorSpeed = 20;
        jointDef.maxMotorTorque = 50;
        return jointDef;
    }

    self.isValid = function(body, bCount) {
        if (bCount < 2 && !body) {
            return false;
        }
        return true;
    }

    return self;
}

function RevoluteChainJointBuilder () {
    var self = JointBuilder(GearJointView);

    self.REQUIRED_OBJECTS_COUNT = 2;

    self._createJointDef = function (bodies, points) {

        var revoluteJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        revoluteJointDef.localAnchorA.Set(points[0].x, points[0].y);
        revoluteJointDef.localAnchorB.Set(points[1].x, points[1].y);
        revoluteJointDef.bodyA = bodies[0];
        revoluteJointDef.bodyB = bodies[1];
        return revoluteJointDef;
     }

    return self;
}

function PrismaticJointBuilder () {
    var self = JointBuilder(PrismaticJointView);

    var axis = new b2Vec2(1, 0);

    self.REQUIRED_OBJECTS_COUNT = 2;

    self._createJointDef = function (bodies, points) {
        var jointDef = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
        jointDef.Initialize(bodies[0], bodies[1], points[0], axis);

        var length = getDistance(points[0], points[1]);

        jointDef.lowerTranslation = -length * 0.3;
        jointDef.upperTranslation = length * 0.3;
        jointDef.enableLimit = true;
        jointDef.maxMotorForce = 100;
        jointDef.motorSpeed = 10;
        jointDef.enableMotor = false;
        return jointDef;
    }

    self.isValid = function(body, bCount) {
        return body ? true : false;
    }
    return self;
}

function GearJointBuilder () {
    var self = JointBuilder(GearJointView);

    self.REQUIRED_OBJECTS_COUNT = 4;

    self._createJointDef = function (bodies, points) {
        var jointRevolute = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        jointRevolute.enableMotor = false;

        jointRevolute.Initialize(bodies[0], bodies[1], points[0]);
        var joint1 = world.CreateJoint(jointRevolute);

        jointRevolute.Initialize(bodies[3], bodies[2], points[3]);
        var joint2 = world.CreateJoint(jointRevolute);

        var gearJointDef = new Box2D.Dynamics.Joints.b2GearJointDef();
        gearJointDef.bodyA = bodies[1];
        gearJointDef.bodyB = bodies[2];
        gearJointDef.joint1 = joint1;
        gearJointDef.joint2 = joint2;
        gearJointDef.collideConnected = true;
        gearJointDef.ratio = -1;
        return gearJointDef;
    }

    self.isValid = function(body, bCount) {
        return true;
    }

    return self;
}

function PulleyJointBuilder () {
    var self = JointBuilder(PulleyJointView);

    self.REQUIRED_OBJECTS_COUNT = 4;

    self._createJointDef = function (bodies, points) {
        var groundAnchor1 = points[2];
        var groundAnchor2 = points[3];
        var ratio = 0.8;

        var pulleyJointDef = new Box2D.Dynamics.Joints.b2PulleyJointDef();
        pulleyJointDef.Initialize(bodies[0], bodies[1], groundAnchor1, groundAnchor2, points[0], points[1], ratio);
        pulleyJointDef.maxLengthA = 600 / SCALE;
        pulleyJointDef.maxLengthB = 600 / SCALE;
        return pulleyJointDef;
    }

    self.isValid = function(body, bCount) {
        return (bCount < 2 && !body) ? false : true;
    }

    return self;
}

function ChainBuilder () {
    var self = {};

    self.createChainJoint = function (bodies, points) {
        var bodyDef = self._createChainJoint(bodies, points)
        for (i = 0; i < bodies.length; i++) {
            bodies[i].SetAwake(true);
        }
    };

    self._createChainJointDef = function () {throw new Error};

    return self;
}

function chainJointBuilder () {

    var self = ChainBuilder();

    self._createChainJoint = function (bodies, points) {
        var length = Math.abs(points[1].x - points[0].x);
        var chainLength = 50 /SCALE;
        var links = length/chainLength;
        var polygonShape = new b2PolygonShape();
        var fixtureDef = new b2FixtureDef();
        var bodyDef = new b2BodyDef();
        // шейп звена цепи
        polygonShape.SetAsBox(5 / SCALE, chainLength / SCALE);
        fixtureDef.density = 1;
        fixtureDef.shape = polygonShape;
        // тело звена цепи
        bodyDef.type = b2Body.b2_dynamicBody;
        // создание звена цепи
        var bodies2 = [];
        for (var i = 0; i < links ; i++) {

            bodyDef.position.Set(points[0].x + chainLength *i / SCALE, points[0].y);
            if (i == 0) {
                points[0].x = 0;
                points[0].y = 0;
                points[1].x = 5 / SCALE;
                points[1].y = chainLength;

                var link = BoxBuilder().build(points,fixtureDef,bodyDef );
                bodies2[0] = bodies[0];
                bodies2[1] = link;
                points[0].x = 0;
                points[0].y = 0;
                points[1].y = -chainLength/2;
                points[1].x = 0;

                RevoluteChainJointBuilder().createJoint(bodies2,points);
            } else {
                points[0].x = 0;
                points[0].y = 0;
                points[1].x = 5 / SCALE;
                points[1].y = chainLength;

                var newLink = BoxBuilder().build(points,fixtureDef,bodyDef );
                bodies2[0] = link;
                bodies2[1] = newLink;
                points[0].x = 0;
                points[0].y = chainLength/2;
                points[1].x = 0;
                points[1].y = -chainLength/2;
                RevoluteChainJointBuilder().createJoint(bodies2,points);
                link = newLink;
            }
        }
        // прикрепляем к концу цепи
        bodies2[0] = link;
        bodies2[1] = bodies[1];
        points[0].x = 0;
        points[0].y = chainLength;
        points[1].x = 0;
        points[1].y = 0;
        RevoluteChainJointBuilder().createJoint(bodies2,points);
    }

    return self;
}