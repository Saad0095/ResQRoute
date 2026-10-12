#include "resqroute/graph.hpp"

#include <fstream>
#include <iostream>
#include <sstream>
#include <string>

int main() {
    constexpr const char* sample_data_path = "data/sample_city.txt";
    std::ifstream input(sample_data_path);
    if (!input) {
        std::cerr << "Error: could not open " << sample_data_path << '\n';
        return 1;
    }

    resqroute::RoadGraph city;
    std::string line;
    while (std::getline(input, line)) {
        if (line.empty() || line.front() == '#') {
            continue;
        }

        std::istringstream row(line);
        std::string from;
        std::string to;
        int distance_km = 0;
        if (row >> from >> to >> distance_km) {
            city.addRoad(from, to, distance_km);
        }
    }

    std::cout << "ResQRoute - Intelligent Emergency Routing & Ambulance Dispatch\n"
              << "Loaded " << city.intersectionCount() << " intersections and "
              << city.roadCount() << " roads.\n"
              << "Starter graph ready for dispatch features.\n";
    return 0;
}
