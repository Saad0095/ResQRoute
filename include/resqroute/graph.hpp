#ifndef RESQROUTE_GRAPH_HPP
#define RESQROUTE_GRAPH_HPP

#include <cstddef>
#include <string>
#include <vector>

namespace resqroute {

struct Road {
    std::string destination;
    int distance_km;
};

class RoadGraph {
public:
    void addRoad(const std::string& from,
                 const std::string& to,
                 int distance_km);

    std::size_t intersectionCount() const noexcept;
    std::size_t roadCount() const noexcept;

private:
    struct Intersection {
        std::string name;
        std::vector<Road> roads;
    };

    std::vector<Intersection> intersections_;
    std::size_t road_count_{0};
};

}  // namespace resqroute

#endif  // RESQROUTE_GRAPH_HPP
