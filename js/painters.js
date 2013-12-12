function Painter() {
    var self = {};

    var axis = new b2Vec2(0, 0);        // нужно для отрисовки точек контура
    self.contour_points_enabled = false;

    self.draw = function() {
        var points = currentController.getPoints();
        if (points.length) {
            self._draw(points);
            if (self.contour_points_enabled) {
                draw_contour_points(points);
            }
        }
    }

    self._draw = function(points) { throw new Error; }

    var draw_contour_points = function (points) {
        for (i = 0; i < points.length; i++) {
            debugDraw.DrawSolidCircle(points[i], CONTOUR_POINT_RADIUS, axis, COLORS.CONTOUR_POINT);
        }
    }

    return self;
}

function SelectionPainter() {
    var self = Painter();

    var selectionArea = [];
    for (var i = 0; i < 4; i++) {
        selectionArea.push(new b2Vec2(0, 0));
    }

    self._draw = function(points) {
        if (points.length) {
            selectionArea[0].x = selectionArea[3].x = points[0].x;
            selectionArea[0].y = selectionArea[1].y = points[0].y;
            selectionArea[1].x = selectionArea[2].x = points[1].x;
            selectionArea[2].y = selectionArea[3].y = points[1].y;
            debugDraw.DrawPolygon(selectionArea, 4, COLORS.SELECTED_AREA);
        }
    }

    return self;
}

function ObjectPainter() {
    var self = Painter();

    self.contour_points_enabled = true;

    return self;
}

function BallContourPainter() {
    var self = ObjectPainter();

    self._draw = function(points) {
        var dx = points[0].x - points[1].x;
        var dy = points[0].y - points[1].y;
        var radius = Math.sqrt(dx * dx + dy * dy);
        debugDraw.DrawCircle(points[0], radius, COLORS.CONTOUR_SHAPE);
    }

    return self;
}

function PolygonContourPainter() {
    var self = ObjectPainter();

    self._draw = function(points) {
        if (points.length >= 2) {
            debugDraw.DrawPolygon(points, points.length, COLORS.CONTOUR_SHAPE);
        }
    }

    return self;
}

function BoxContourPainter() {
    var self = ObjectPainter();

    var contour = [];
    for (var i = 0; i < 4; i++) {
        contour.push(new b2Vec2(0, 0));
    }

    self._draw = function(points) {
        contour[0].x = contour[3].x = points[0].x;
        contour[0].y = contour[1].y = points[0].y;
        contour[1].x = contour[2].x = points[1].x;
        contour[2].y = contour[3].y = points[1].y;
        debugDraw.DrawPolygon(contour, 4, COLORS.CONTOUR_SHAPE);
    }

    return self;
}

/* Класс, инкапсулирующий ифнормацию для отрисовки фигуры */
function ShapeView(body, color) {
    var self = {};
    self._body = body;
    self._isSelected = false;

//    self._color = new b2Color(Math.random(), Math.random(), Math.random());
    self._color = color;
//    self._color = new b2Color(0, 0, 0);

    self.draw = function() { throw new Error; }

    self.setSelected = function(selected) {
        self._isSelected = selected;
    }

    return self;
}

function BallView(body, color) {
    var self = ShapeView(body, color);

    self.draw = function() {
        var color = (self._isSelected) ? COLORS.SELECTED_SHAPE : self._color;
        var shape = self._body.GetFixtureList().GetShape();
        debugDraw.DrawSolidCircle(self._body.GetPosition(), shape.GetRadius(), new b2Vec2(0, 0), color);
    }

    return self;
}

function PolygonView(body, color) {
    var self = ShapeView(body, color);

    self.draw = function() {
        var color = (self._isSelected) ? COLORS.SELECTED_SHAPE : self._color;
        var shape = self._body.GetFixtureList().GetShape();
        var localVertices = shape.GetVertices();
        var transform = self._body.GetTransform();
        var vertices = [];
        for (var i = 0; i < shape.GetVertexCount(); ++i) {
            vertices.push(b2Math.MulX(transform, localVertices[i]));
        }
        debugDraw.DrawSolidPolygon(vertices, vertices.length, color);

    }

    return self;
}