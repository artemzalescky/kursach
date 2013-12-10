function JointBuilder () {
    var self = {};

    self.REQUIRED_BODIES_NUMBER = null;

    self.createJoint = function (bodies, points) {
        var jointDef = self._createJointDef(bodies, points)
        world.CreateJoint(jointDef);

        for (i = 0; i < bodies.length; i++) {
            bodies[i].SetAwake(true);
        }
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
        jointDef.motorSpeed = 17;
        jointDef.maxMotorTorque = 20;
        return jointDef;
    }

    return self;
}