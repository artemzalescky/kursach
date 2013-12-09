function JointBuilder () {
    var self = {};

    self.REQUIRED_BODIES_NUMBER = null;

    self.createJoint = function (bodies) {throw new Error};

    return self;
}

function DistanceJointBuilder () {
    var self = JointBuilder();

    self.REQUIRED_BODIES_NUMBER = 2;

    self.createJoint = function (bodies) {
        var jointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef();
        jointDef.Initialize(
            bodies[1],
            bodies[0],
            bodies[1].GetWorldCenter(),
            bodies[0].GetWorldCenter()
        );
        jointDef.length = 5;
        jointDef.collideConnected = true;
        world.CreateJoint(jointDef);
        bodies[0].SetAwake(true);  //будим тело 1
        bodies[1].SetAwake(true);  //будим тело 2
    }

    return self;
}