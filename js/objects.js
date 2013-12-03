function toMeters(pixels){		// перевод из пикселей в метры
	return pixels / SCALE;
}

function addBox_expanded(x,y,width,height,density,restitution,is_static){	// больше параметров
	var fixDef = new b2FixtureDef;
	
	if (is_static === undefined) {		// параметр по умолчанию
		is_static = false;			// тела считаем динамическими
	}
	
	fixDef.density = density;		// плотность
	fixDef.friction = 0.5;		// коэфициент трения
	fixDef.restitution = restitution;	// коэффицент упругости

	var bodyDef = new b2BodyDef;	// определение тела    
	bodyDef.type = b2Body.b2_staticBody;	// статический тип тела - не двигается
	bodyDef.position.x = toMeters(x);				// координаты позиции тела
	bodyDef.position.y = toMeters(y);
	bodyDef.type = is_static ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;	// уст. тип тела
	
	fixDef.shape = new b2PolygonShape;		// фигура - многоугольник
	fixDef.shape.SetAsBox(toMeters(width/2),toMeters(height/2));		// прямоугольник

	//bodyDef.linearVelocity=new b2Vec2(-15,-10);		// скорость
	
	var body = world.CreateBody(bodyDef);	// создаем тело
	body.CreateFixture(fixDef);				// прикрепляем к телу фигуру
	//body.SetAngle(0.1);
	return body;
}

function addBox(x,y,width,height,is_static){	// добавить тело - прямоугольник (параметры в пикселях)
	return addBox_expanded(x,y,width,height,0.5,0.3,is_static);
}

function addPoly(x,y,v,angle,is_static){	//  многоугольник v - массив вершин
	var fixDef = new b2FixtureDef;
	
	if (is_static === undefined) {		// параметр по умолчанию
		is_static = false;			// тела считаем динамическими
	}
	
	fixDef.density = 0.5;		// плотность
	fixDef.friction = 0.5;		// коэфициент трения
	fixDef.restitution = 0.3;	// коэффицент упругости

	var bodyDef = new b2BodyDef;	// определение тела    
	bodyDef.type = b2Body.b2_staticBody;	// статический тип тела - не двигается
	bodyDef.position.x = toMeters(x);				// координаты позиции тела
	bodyDef.position.y = toMeters(y);

	bodyDef.type = is_static ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;	// уст. тип тела
	 
	fixDef.shape = new b2PolygonShape;		// фигура - многоугольник

	vecs = [];
		
	for(i=0;i<v.length;i++){
		cc = new b2Vec2(v[i][0],v[i][1]);
		vecs[i] = cc;
	}

	fixDef.shape.SetAsArray(vecs,vecs.length);		// устанавливаем форму многоугольника (массив вершин)
	
	var body = world.CreateBody(bodyDef);	// создаем тело
	body.CreateFixture(fixDef);				// прикрепляем к телу фигуру
	body.SetAngle(angle);					// угол фигуры
	
	return body;
}

function addBall_expanded(x,y,radius,density,restitution,is_static){		// круг  больше параметров
	var fixDef = new b2FixtureDef;
	
	if (is_static === undefined) {		// параметр по умолчанию
		is_static = false;			// тела считаем динамическими
	}
	
	fixDef.density = density;		// плотность
	fixDef.friction = 0.5;		// коэфициент трения
	fixDef.restitution = restitution;	// коэффицент упругости

	var bodyDef = new b2BodyDef;	// определение тела
	bodyDef.type = b2Body.b2_staticBody;	// статический тип тела - не двигается
	bodyDef.position.x = toMeters(x);				// координаты позиции тела
	bodyDef.position.y = toMeters(y);
	bodyDef.type = is_static ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;	// уст. тип тела

	fixDef.shape = new b2CircleShape(toMeters(radius));

	var body = world.CreateBody(bodyDef);	// создаем тело
	body.CreateFixture(fixDef);				// прикрепляем к телу фигуру
	
	return body;
}

function addBall(x,y,radius,is_static){		// добавить тело - круг (параметры в пикселях)
	return addBall_expanded(x,y,radius,0.5,0.3,is_static);
}

function addHuman_expanded(x,y,k,density,restitution){		// фигура человека	k - коэф. размера (1-норм)
	var body1;
	var body2;
	var jointDef;
	
	body1 = addBall_expanded(x,y-k*61,k*20,density,restitution);		// голова
	body2 = addBox_expanded(x,y,k*30,k*80,density,restitution);		// тело
		
	jointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef();
	jointDef.Initialize(body1,
	body2,
	body1.GetWorldCenter(),
	new b2Vec2(body2.GetWorldCenter().x,body2.GetWorldCenter().y-k*toMeters(40)));
	jointDef.collideConnected = true;
	world.CreateJoint(jointDef);
		
	body1 = addBox_expanded(x-k*30,y,k*14,k*60,density,restitution);	// левая рука
	jointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef();
	jointDef.Initialize(body1,
	body2,
	new b2Vec2(body1.GetWorldCenter().x,body1.GetWorldCenter().y-k*toMeters(25)),
	new b2Vec2(body2.GetWorldCenter().x-k*toMeters(15),body2.GetWorldCenter().y-k*toMeters(30)));
	jointDef.collideConnected = true;
	world.CreateJoint(jointDef);
	
	body1 = addBox_expanded(x+k*30,y,k*14,k*60,density,restitution);	// правая рука
	jointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef();
	jointDef.Initialize(body1,
	body2,
	new b2Vec2(body1.GetWorldCenter().x,body1.GetWorldCenter().y-k*toMeters(25)),
	new b2Vec2(body2.GetWorldCenter().x+k*toMeters(15),body2.GetWorldCenter().y-k*toMeters(30)));
	jointDef.collideConnected = true;
	world.CreateJoint(jointDef);
	
	body1 = addBox_expanded(x-k*10,y+k*71,k*14,k*60,density,restitution);	// левая нога
	jointDef.Initialize(body1,
	body2,
	new b2Vec2(body1.GetWorldCenter().x,body1.GetWorldCenter().y-k*toMeters(25)),
	new b2Vec2(body2.GetWorldCenter().x-k*toMeters(5),body2.GetWorldCenter().y+k*toMeters(30)));
	jointDef.collideConnected = true;
	world.CreateJoint(jointDef);
	
	body1 = addBox_expanded(x+k*10,y+k*71,k*14,k*60,density,restitution);	// правая нога
	jointDef.Initialize(body1,
	body2,
	new b2Vec2(body1.GetWorldCenter().x,body1.GetWorldCenter().y-k*toMeters(25)),
	new b2Vec2(body2.GetWorldCenter().x+k*toMeters(5),body2.GetWorldCenter().y+k*toMeters(30)));
	jointDef.collideConnected = true;
	world.CreateJoint(jointDef);
}

function addHuman(x,y,k){		// фигура человека	k - коэф. размера (1-норм)
	addHuman_expanded(x,y,k,0.5,0.3);
}

function addWater(x,y,width,height){
	var fixDef = new b2FixtureDef;
	
	//fixDef.density = 1.0;		// плотность устанавливается в setupBuoyancyController()
	fixDef.friction = 0.5;		// коэфициент трения
	fixDef.restitution = 0.3;	// коэффицент упругости
	fixDef.isSensor = true;		// сенсор

	var bodyDef = new b2BodyDef;	// определение тела
	bodyDef.type = b2Body.b2_staticBody;	// статический тип тела - не двигается
	bodyDef.position.x = toMeters(x);				// координаты позиции тела
	bodyDef.position.y = toMeters(y);

	fixDef.shape = new b2PolygonShape;		// фигура - многоугольник
	fixDef.shape.SetAsBox(toMeters(width/2),toMeters(height/2));		// прямоугольник

	var body = world.CreateBody(bodyDef);	// создаем тело
	body.CreateFixture(fixDef);				// прикрепляем к телу фигуру
	
	return body;
}

function createPool(x,y,width,height){	// создаем бассейн
		addWater(x,y,width,height);				// создаем воду
		addBox(x,y+height/2+5,width,10,true);	// дно
		addBox(x,y+height/2+5,width,10,true);
		addBox(x-width/2-5,y-5,10,height+30,true);	// бортик
		addBox(x-width/2-5,y-5,10,height+30,true);
		addBox(x+width/2+5,y-5,10,height+30,true);	// бортик
		addBox(x+width/2+5,y-5,10,height+30,true);
	}
	

