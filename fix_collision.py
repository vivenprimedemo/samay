#!/usr/bin/env python3

# Read the current script
with open('script.js', 'r') as f:
    content = f.read()

# 1. Rename the global declaration
content = content.replace('let planetData = {};', 'let planetInfoData = {};')

# 2. Rename usage in initPlanetData
content = content.replace('planetData = {', 'planetInfoData = {')

# 3. Rename usage in onPlanetClick
# We need to be careful not to rename usage in createPlanets which uses the array
# The array usage is planetData.forEach or planetData.length
# The object usage is planetData[name]

content = content.replace('if (planetData[name]) {', 'if (planetInfoData[name]) {')
content = content.replace('planetData[name].type', 'planetInfoData[name].type')
content = content.replace('planetData[name].distance', 'planetInfoData[name].distance')
content = content.replace('planetData[name].diameter', 'planetInfoData[name].diameter')
content = content.replace('planetData[name].desc', 'planetInfoData[name].desc')

# Write the modified content
with open('script.js', 'w') as f:
    f.write(content)

print("Successfully fixed variable name collision!")
