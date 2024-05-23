import base64
import json
import sys
import urllib.request
import urllib.parse

file_path = sys.argv[1]
file_name = file_path.split('/')[-1]

# Read and encode the file
with open(file_path, "rb") as image_file:
    file_encoded = base64.b64encode(image_file.read()).decode('utf-8')

# Prepare the JSON data
r_json = {
    'name': file_name,
    'type': 'image',
    'isPublic': True,
    'data': file_encoded,
    'parentId': sys.argv[3]
}
r_headers = {
    'X-Token': sys.argv[2],
    'Content-Type': 'application/json'
}

# Convert JSON data to bytes
data = json.dumps(r_json).encode('utf-8')

# Create the request
req = urllib.request.Request(
    url="http://0.0.0.0:5000/files",
    data=data,
    headers=r_headers,
    method='POST'
)

# Send the request and print the response
with urllib.request.urlopen(req) as response:
    response_data = response.read()
    print(json.loads(response_data.decode('utf-8')))
