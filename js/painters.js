// генерируем функцию, которая преобразует набор точек в строку комманд для path в svg
var pointsToSvgLine = d3.svg.line()
        .x(function(point) {return point.x * SCALE;})
        .y(function(point) {return point.y * SCALE;})
        .interpolate("linear");


function Painter() {
    var self = {};

    self.contourPointsEnabled = false;
    var contourPointsSvg = [];

    self.draw = function() {
        var points = currentController.getPoints();
        if (points.length) {
            self._draw(points);
            if (self.contourPointsEnabled) {
                drawContourPoints(points);
            }
        }
    };

    self.reset = function() {
        for (i = 0; i < contourPointsSvg.length; i++) {
            contourPointsSvg[i].remove();
        }
        contourPointsSvg = [];
    };

    self._draw = function(points) { throw new Error; }

    var drawContourPoints = function (points) {

        for (i = contourPointsSvg.length; i < points.length; i++) {
            var point_svg = svgCanvas.append('circle').attr('r', CONTOUR_POINT_RADIUS);
            contourPointsSvg.push(point_svg);
        }

        for (i = 0; i < points.length; i++) {
            contourPointsSvg[i]
                .attr('cx', points[i].x * SCALE)
                .attr('cy', points[i].y * SCALE)
                .attr('fill', COLORS.CONTOUR_POINT);
        }
    };

    return self;
}

function SelectionPainter() {
    var self = Painter();

    selectionSvg = null;

    self._draw = function(points) {
        if (points.length) {
            if (!selectionSvg) {
                selectionSvg = svgCanvas.append('rect')
                    .attr('stroke', COLORS.SELECTED_STROKE)
                    .attr('fill', COLORS.SELECTED_AREA)
            }

            points = correctedPoints(points);
            selectionSvg
                .attr('x', points[0].x * SCALE)
                .attr('y', points[0].y * SCALE)
                .attr('width', (points[1].x - points[0].x) * SCALE)
                .attr('height', (points[1].y - points[0].y) * SCALE)
        }
    }

    self.reset = function() {
        selectionSvg.remove();
        selectionSvg = null;
    }

    return self;
}

function ContourPainter() {
    var self = Painter();

    self._contourSvg = null;

    self.contourPointsEnabled = true;

    var super_draw = self.draw
    self.draw = function() {
        if (!self._contourSvg) {
            self._initContourSvg();
        }
        super_draw();
    }

    self._initContourSvg = function() {
        throw new Error; // Not implemented
    }

    var super_reset = self.reset
    self.reset = function() {
        super_reset();
        self._contourSvg.remove();
        self._contourSvg = null;
    }

    return self;
}

function BallContourPainter() {
    var self = ContourPainter();

    self._initContourSvg = function() {
        self._contourSvg = svgCanvas.append('circle')
            .attr('fill', 'none')
            .attr('stroke-width', 2)
            .attr('stroke', COLORS.CONTOUR_SHAPE);
    }

    self._draw = function(points) {
        var dx = points[0].x - points[1].x;
        var dy = points[0].y - points[1].y;
        var radius = Math.sqrt(dx * dx + dy * dy);

        self._contourSvg
            .attr('r', radius * SCALE)
            .attr('cx', points[0].x * SCALE)
            .attr('cy', points[0].y * SCALE)
    }

    return self;
}

function PolygonContourPainter() {
    var self = ContourPainter();

    self._initContourSvg = function() {
        self._contourSvg = svgCanvas.append('path')
            .attr('fill', 'none')
            .attr('stroke-width', 2)
            .attr('stroke', COLORS.CONTOUR_SHAPE);
    }

    self._draw = function(points) {
        if (points.length >= 2) {
            self._contourSvg
                .attr('d', pointsToSvgLine(points));
        }
    }

    return self;
}

function BoxContourPainter() {
    var self = ContourPainter();

    self._initContourSvg = function() {
        self._contourSvg = svgCanvas.append('rect')
            .attr('fill', 'none')
            .attr('stroke-width', 2)
            .attr('stroke', COLORS.CONTOUR_SHAPE);
    }

    self._draw = function(points) {
        points = correctedPoints(points);
        self._contourSvg
            .attr('x', points[0].x * SCALE)
            .attr('y', points[0].y * SCALE)
            .attr('width', (points[1].x - points[0].x) * SCALE)
            .attr('height', (points[1].y - points[0].y) * SCALE)
    }

    return self;
}

/* Класс, инкапсулирующий ифнормацию для отрисовки фигуры */
function ShapeView(body, color) {
    var self = {};
    self._body = body;
    self._isSelected = false;

    self._color = color;

    self.draw = function() { throw new Error; }

    self.setSelected = function(selected) {
        self._isSelected = selected;
    }

    self.destroy = function() {
        throw new Error;
    }

    return self;
}

function BallView(body, color) {
    var self = ShapeView(body, color);

    var ball_svg = svgCanvas.append('circle')
            .attr('stroke-width', 2)
            .attr('stroke', COLORS.OBJECT_STROKE);

    var angleLineSvg = svgCanvas.append('line')
            .attr('stroke-width', 1)
            .attr('stroke', COLORS.OBJECT_STROKE)
            .attr('fill', 'none');

    self.draw = function() {
        var color = (self._isSelected) ? COLORS.SELECTED_SHAPE : self._color;
        var shape = self._body.GetFixtureList().GetShape();
        var r = shape.GetRadius();
        var pos = self._body.GetPosition();

        ball_svg
            .attr('fill', color)
            .attr('r', r * SCALE)
            .attr('cx', pos.x * SCALE)
            .attr('cy', pos.y * SCALE);

        // Draw body angle line
        angle = -self._body.GetAngle();
        xStrokePoint = pos.x + r * Math.sin(angle);
        yStrokePoint = pos.y + r * Math.cos(angle);
        angleLineSvg
            .attr('x1', pos.x * SCALE)
            .attr('y1', pos.y * SCALE)
            .attr('x2', xStrokePoint * SCALE)
            .attr('y2', yStrokePoint * SCALE);

    }

    self.destroy = function() {
        ball_svg.remove();
    }

    return self;
}

function PolygonView(body, color) {
    var self = ShapeView(body, color);

    var polygon_svg = svgCanvas.append('path')
        .attr('stroke-width', 2)
        .attr('stroke', COLORS.OBJECT_STROKE);

    self.draw = function() {
        var color = (self._isSelected) ? COLORS.SELECTED_SHAPE : self._color;
        var shape = self._body.GetFixtureList().GetShape();
        var localVertices = shape.GetVertices();
        var transform = self._body.GetTransform();
        var vertices = [];
        for (var i = 0; i < shape.GetVertexCount(); ++i) {
            vertices.push(b2Math.MulX(transform, localVertices[i]));
        }
        vertices.push(vertices[0]);
        polygon_svg
            .attr('fill', color)
            .attr('d', pointsToSvgLine(vertices));
    }

    self.destroy = function() {
        polygon_svg.remove();
    }

    return self;
}

/****/
function JointView(joint) {
    var self = {};

    self._joint = joint;

    self._getTransform = function(p1, p2) {
        angle = getAngle(p1, p2);
        return d3.transform(
            translateStr(p1.x * SCALE, p1.y * SCALE) + rotateStr(angle)
        );
    }

    self._draw = function(p1, p2) {
        throw new Error;
    }

    self.draw = function() {
        var p1 = self._joint.GetAnchorA();
        var p2 = self._joint.GetAnchorB();
        self._draw(p1, p2);
    }

    return self;
}

function RevoluteJointView(joint) {
    var self = JointView(joint);

    var jointSvgA = svgCanvas.append('path')
        .attr('stroke-width', 2)
        .attr('stroke', 'black')
        .attr('fill', 'none');
    var jointSvgB = svgCanvas.append('path')
        .attr('stroke-width', 2)
        .attr('stroke', 'black')
        .attr('fill', 'none');

    var jointSvgCircle = svgCanvas.append('circle')
        .attr('stroke-width', 3)
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('r', 9);

    self._draw = function(p1, p2) {
        // p1 and p2 in this case are one point
        var bodyAPos = self._joint.GetBodyA().GetPosition();
        var bodyBPos = self._joint.GetBodyB().GetPosition();

        var lengthA = getDistance(p1, bodyAPos) * SCALE;
        var lengthB = getDistance(p1, bodyBPos) * SCALE;

        var pointsA = self._generatePoints(lengthA);
        var pointsB = self._generatePoints(lengthB);

        jointSvgA
            .attr('d', pointsToSvgLinePx(pointsA))
            .attr('transform', self._getTransform(p1, bodyAPos));

        jointSvgB
            .attr('d', pointsToSvgLinePx(pointsB))
            .attr('transform', self._getTransform(p1, bodyBPos));

        jointSvgCircle
            .attr('cx', p1.x * SCALE)
            .attr('cy', p1.y * SCALE);
    }

    self._generatePoints = function(length) {
        var points = [];
        points.push(new b2Vec2(0, -10));
        points.push(new b2Vec2(0, 10));
        points.push(new b2Vec2(0, 0));
        points.push(new b2Vec2(length, 0));
        return points;
    }

    self.destroy = function() {
        jointSvgA.remove();
        jointSvgB.remove();
        jointSvgCircle.remove();
    }

    return self;
}

function DistanceJointView(joint) {
    var self = JointView(joint);

    var jointSvg = svgCanvas.append('path')
        .attr('stroke-width', 6)
        .attr('stroke', 'black')
        .attr('fill', 'none');

    self._draw = function(p1, p2) {
        var points = [];

        var bodyAPos = self._joint.GetBodyA().GetPosition();
        var bodyBPos = self._joint.GetBodyB().GetPosition();

        points.push(bodyAPos);
        points.push(p1);
        points.push(p2);
        points.push(bodyBPos);

        jointSvg.attr('d', pointsToSvgLine(points));
    }

    self.destroy = function() {
        jointSvg.remove();
    }

    return self;
}

function GearJointView(joint) {
    var self = JointView(joint);

    self._draw = function(p1, p2) {

    }

    self.destroy = function() {

    }

    return self;
}

function PulleyJointView(joint) {
    var self = JointView(joint);

    var jointSvgCircles = [];
    var jointSvgLines = [];
    for (var i = 0; i < 2; ++i) {
        var circle =  svgCanvas.append('circle')
            .attr('fill', 'black')
            .attr('r', 9);
        jointSvgCircles.push(circle);

        var line = svgCanvas.append('line')
            .attr('stroke-width', 2)
            .attr('stroke', 'black')
            .attr('fill', 'none');
        jointSvgLines.push(line);
    }

    self._draw = function(p1, p2) {
        var grounds = [];
        grounds.push(self._joint.GetGroundAnchorA());
        grounds.push(self._joint.GetGroundAnchorB());

        var points = [];
        points.push(p1);
        points.push(p2);

        for (var i = 0; i < 2; ++i) {
            jointSvgCircles[i]
                .attr('cx', grounds[i].x * SCALE)
                .attr('cy', grounds[i].y * SCALE);

            jointSvgLines[i]
                .attr('x1', points[i].x * SCALE)
                .attr('y1', points[i].y * SCALE)
                .attr('x2', grounds[i].x * SCALE)
                .attr('y2', grounds[i].y * SCALE);
        }
    }

    self.destroy = function() {
        for (var i = 0; i < 2; ++i) {
            jointSvgLines[i].remove();
            jointSvgCircles[i].remove();
        }
    }

    return self;
}

function PrismaticJointView(joint) {
    var self = JointView(joint);

    var cylinderWidth = 8;

    var jointSvgRod = svgCanvas.append('line')
        .attr('stroke-width', 2)
        .attr('stroke', 'black')
        .attr('fill', 'none');
    var jointSvgBall = svgCanvas.append('circle')
        .attr('fill', 'black')
        .attr('r', cylinderWidth - 2);

    var bodyAPos = joint.GetBodyA().GetPosition();
    var bodyBPos = joint.GetBodyB().GetPosition();
    // length of cylinder in pixels
    // MAGIC, don't touch
    var cylinderLength = getDistance(bodyAPos, bodyBPos) * 0.7 * SCALE;
    var rodLength = getDistance(bodyAPos, bodyBPos) * 0.6 * SCALE;

    var jointSvgCylinder = svgCanvas.append('path')
        .attr('stroke-width', 2)
        .attr('stroke', 'black')
        .attr('fill', 'none');

    self._draw = function(p1, p2) {
        // draw rod
        var bodyAPos = self._joint.GetBodyA().GetPosition();
        var bodyBPos = self._joint.GetBodyB().GetPosition();

        var points = [];
        points.push(new b2Vec2(cylinderLength, cylinderWidth));
        points.push(new b2Vec2(0, cylinderWidth));
        points.push(new b2Vec2(0, -cylinderWidth));
        points.push(new b2Vec2(cylinderLength, -cylinderWidth));

        jointSvgCylinder.attr('d', pointsToSvgLinePx(points))
            .attr('transform', self._getTransform(bodyAPos, bodyBPos));

        jointSvgRod.attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', rodLength)
            .attr('y2', 0)
            .attr('transform', self._getTransform(bodyBPos, bodyAPos));

        jointSvgBall.attr('cx', rodLength)
            .attr('cy', 0)
            .attr('transform', self._getTransform(bodyBPos, bodyAPos));
    }

    self.destroy = function() {
        jointSvgRod.remove();
        jointSvgCylinder.remove();
        jointSvgBall.remove();
    }

    return self;
}