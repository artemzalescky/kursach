function JointBuilder () {
    var self = {};

    self.REQUIRED_BODIES_NUMBER = null;

    self.createJoint = function (bodies, points) {
        var jointDef = self._createJointDef(bodies, points);
        var joint = world.CreateJoint(jointDef);
        joint.userData = JointView(joint);

        for (i = 0; i < bodies.length; i++) {
            bodies[i].SetAwake(true);
        }
        return joint;
    };

    self._createJointDef = function () {throw new Error};

    return self;
}

function DistanceJointBuilder () {
    var self = JointBuilder();

    self.REQUIRED_BODIES_NUMBER = 2;

    self._createJointDef = function (bodies, points) {
        var jointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef();
        jointDef.Initialize(
            bodies[1],
            bodies[0],
            points[1],
            points[0]
        );
        jointDef.length = 5;
        jointDef.collideConnected = true;
        return jointDef;
    }

    return self;
}

function RevoluteJointBuilder () {
    var self = JointBuilder();

    self.REQUIRED_BODIES_NUMBER = 2;

    self._createJointDef = function (bodies, points) {
        var jointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        jointDef.Initialize(bodies[0], bodies[1], points[0]);
        jointDef.enableMotor = true;
        jointDef.motorSpeed = 107;
        jointDef.maxMotorTorque = 50;
        return jointDef;
    }

    return self;
}

function PrismaticJointBuilder () {
    var self = JointBuilder();

    axis = new b2Vec2(1, 0);

    self.REQUIRED_BODIES_NUMBER = 2;

    self._createJointDef = function (bodies, points) {
        var jointDef = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
        jointDef.Initialize(bodies[0], bodies[1], points[0], axis);
        jointDef.lowerTranslation = -5;
        jointDef.upperTranslation = 5;
        jointDef.enableLimit = true;
        jointDef.maxMotorForce = 100;
        jointDef.motorSpeed = 5.0;
        jointDef.enableMotor = true;
        return jointDef;
    }

    return self;
}

function GearJointBuilder () {
    var self = JointBuilder();

    self.REQUIRED_BODIES_NUMBER = 4;

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

    return self;
}

function PulleyJointBuilder () {
    var self = JointBuilder();

    self.REQUIRED_BODIES_NUMBER = 2;

    self._createJointDef = function (bodies, points) {
        var groundAnchor1 = new b2Vec2(points[0].x, points[0].y - (300 / SCALE));
        var groundAnchor2 = new b2Vec2(points[1].x, points[1].y - (300 / SCALE));

        var ratio = 0.8;

        var pulleyJointDef = new Box2D.Dynamics.Joints.b2PulleyJointDef();
        pulleyJointDef.Initialize(bodies[0], bodies[1], groundAnchor1, groundAnchor2, points[0], points[1], ratio);
        pulleyJointDef.maxLengthA = 600 / SCALE;
        pulleyJointDef.maxLengthB = 600 / SCALE;
        return pulleyJointDef;
    }

    return self;
}
