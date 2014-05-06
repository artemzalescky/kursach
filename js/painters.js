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
            var point_svg = svg.append('circle').attr('r', CONTOUR_POINT_RADIUS);
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
                selectionSvg = svg.append('rect')
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
        self._contourSvg = svg.append('circle')
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
        self._contourSvg = svg.append('path')
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
        self._contourSvg = svg.append('rect')
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

    var ball_svg = svg.append('circle')
            .attr('stroke-width', 2)
            .attr('stroke', COLORS.OBJECT_STROKE);

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
    }

    self.destroy = function() {
        ball_svg.remove();
    }

    return self;
}

function PolygonView(body, color) {
    var self = ShapeView(body, color);

    var polygon_svg = svg.append('path')
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

function JointView(joint) {
    var self = ShapeView(joint, COLORS.SELECTED_SHAPE);

    var jointSvg = svg.append('line')
        .attr('stroke-width', 2)
        .attr('stroke', 'black');

    self.draw = function() {
        var p1 = self._body.GetAnchorA();
        var p2 = self._body.GetAnchorB();

        jointSvg.attr('x1', p1.x * SCALE)
            .attr('y1', p1.y * SCALE)
            .attr('x2', p2.x * SCALE)
            .attr('y2', p2.y * SCALE);
    }

    self.destroy = function() {
        jointSvg.remove();
    }

    return self;
}
