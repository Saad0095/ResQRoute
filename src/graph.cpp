#include "resqroute/graph.hpp"

#include <algorithm>

namespace resqroute {

void RoadGraph::addRoad(const std::string& from,
                        const std::string& to,
                        int distance_km) {
    auto findIntersection = [this](const std::string& name) {
        return std::find_if(
            intersections_.begin(),
            intersections_.end(),
            [&name](const Intersection& intersection) {
                return intersection.name == name;
            });
    };

    auto from_it = findIntersection(from);
    if (from_it == intersections_.end()) {
        intersections_.push_back({from, {}});
        from_it = std::prev(intersections_.end());
    }

    auto to_it = findIntersection(to);
    if (to_it == intersections_.end()) {
        intersections_.push_back({to, {}});
    }

    from_it->roads.push_back({to, distance_km});
    ++road_count_;
}

std::size_t RoadGraph::intersectionCount() const noexcept {
    return intersections_.size();
}

std::size_t RoadGraph::roadCount() const noexcept {
    return road_count_;
}

}  // namespace resqroute
