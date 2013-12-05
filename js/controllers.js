// контроллер выделения фигур
function SelectController() {
    var self = {};

    var startPoint = new b2Vec2(0, 0); // начальная точка
    var endPoint = new b2Vec2(0, 0); // конечная точка

    var selectedShapes = []; // список выделенных фигур
    var selectedArea = new b2AABB(); // выделенная область
    var activeShapes = []; // список активности фигур

    // устанавливает стартовую точку (координаты x, y - в пикселях)
    self.setStartPoint = function(x, y) {
        startPoint.Set(toMeters(x), toMeters(y));
        endPoint.Set(toMeters(x), toMeters(y));
    }

    self.setEndPoint = function(x, y) {
        endPoint.Set(toMeters(x), toMeters(y));
    }

    // корректирует начальную и конечную точки. xMin, yMin - верхний левый угол. xMax, yMax - нижний правый
    var correctPoints = function() {
        var xMax = (startPoint.x >= endPoint.x) ? startPoint.x : endPoint.x;
        var xMin = (startPoint.x < endPoint.x) ? startPoint.x : endPoint.x;
        var yMax = (startPoint.y >= endPoint.y) ? startPoint.y : endPoint.y;
        var yMin = (startPoint.y < endPoint.y) ? startPoint.y : endPoint.y;
        startPoint.Set(xMin, yMin);
        endPoint.Set(xMax, yMax);
    }

    // активирует все фигуры для того, чтобы можно было выделить даже неактивные
    // ATTENTION! обязателен вызов в паре с deactivateShapes
    var activateShapes = function() {
        var shapes = world.GetBodyList();
        while (shapes) {
            activeShapes.push(shapes.IsActive());
            shapes.SetActive(true);
            shapes = shapes.GetNext();
        }
    }

    // возвращает все фигуры в исходное состояние
    var deactivateShapes = function() {
        var shapes = world.GetBodyList();
        while (shapes) {
            shapes.SetActive(activeShapes.shift());
            shapes = shapes.GetNext();
        }
    }

    // обновляет выделение
    // @param clear - очистка списка выделенных фигур (true по умолчанию)
    self.updateSelection = function(clear) {
        if (clear === undefined) {
            clear = true;
        }
        if (clear) {
            selectedShapes = [];
        }

        correctPoints();
        selectedArea.lowerBound.Set(startPoint.x, startPoint.y);
        selectedArea.upperBound.Set(endPoint.x, endPoint.y);

        function getBodyCallback(fixture) {
            var shapesAabb = fixture.GetAABB();
            var inside = shapesAabb.TestOverlap(selectedArea);
            if (inside) {
                selectedShapes.push(fixture.GetBody());
            }
            return true;
        }

        activateShapes();
        world.QueryAABB(getBodyCallback, selectedArea);
        deactivateShapes();

        return selectedShapes;
    }

    self.getStartPoint = function() {
        return startPoint;
    }

    self.getEndPoint = function() {
        return endPoint;
    }

    return self;
}


function Painter() {
    var self = {};

    var selectionRegion = [];
    var selectionColor = new b2Color(0, 0, 0.85);
    for (var i = 0; i < 4; i++) {
        selectionRegion.push(new b2Vec2(0, 0));
    }
    var active = false;

    self.drawAll = function() {
        if (active) {
            debugDraw.DrawSolidPolygon(selectionRegion, 4, selectionColor);
        }
    }

    self.setSelectionActive = function(a) {
        active = a;
    }

    self.setSelectionRegion = function(p1, p2) {
        selectionRegion[0].x = selectionRegion[3].x = p1.x;
        selectionRegion[0].y = selectionRegion[1].y = p1.y;
        selectionRegion[1].x = selectionRegion[2].x = p2.x;
        selectionRegion[2].y = selectionRegion[3].y = p2.y;
    }
    return self;
}