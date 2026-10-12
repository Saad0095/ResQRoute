cmake_minimum_required(VERSION 3.15)

project(ResQRoute
    VERSION 0.1.0
    DESCRIPTION "Intelligent Emergency Routing and Ambulance Dispatch"
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(resqroute
    src/graph.cpp
    src/main.cpp
)

target_include_directories(resqroute PRIVATE include)

if (MSVC)
    target_compile_options(resqroute PRIVATE /W4)
else()
    target_compile_options(resqroute PRIVATE -Wall -Wextra -Wpedantic)
endif()
