import json
import pprint
import sseclient
import requests
import threading
import sys

port = 3000
baseURL = 'http://localhost:' + str(port)
completeURL = baseURL

myRides = {}

def addNewRide(uid, ride):
    myRides[uid] = ride

def createNewThread(client, newRide, addNewRide):
    firstValue = True
    for event in client.events():
        if (firstValue):
            addNewRide(str(event.data), newRide)
            firstValue = False
        else:
            print()
            pprint.pprint(event.data)

print('##### Welcome to Carpool! #####')
userName = str(input('Please type your name: '))
userPhoneNum = str(input('Please type your phone number: '))
clientType = str(input('Are you looking for a ride (1) or offering one (2)?: '))

if (clientType == '1'):
    completeURL += '/passengers'
elif (clientType == '2'):
    completeURL += '/drivers'
else:
    print('Invalid option :(')
    sys.exit(0)
    

print()
print('User created successfully!!')
print()

while(True):    
    print()
    print('###### MENU ######')
    print("1. Subscribe new ride")
    print("2. Unsubscribe ride")
    print("3. Look up rides")
    menuOption = str(input('- Select here: '))
    print()

    if (menuOption == '1'):
        print('# Subscribing new ride #')
        origin = str(input('- Origin: '))
        destination = str(input('- Destination: '))
        date = str(input('- Date: '))

        newRide = {'name': userName, 
                   'phoneNum': userPhoneNum, 
                   'origin': origin, 
                   'destination': destination, 
                   'date': date}
        
        headers = {'Accept': 'text/event-stream'}
        response = requests.post(completeURL, json=newRide, stream=True, headers=headers)
        client = sseclient.SSEClient(response)
        
        t = threading.Thread(target=createNewThread, args=(client, newRide, addNewRide))
        t.start()

        print()
        print('Successfully subscribed! \o/')
        print()
    
    elif (menuOption == '2'):
        print('# Unsubscribing ride #')
        print()

        for key in myRides:
            ride = myRides[key]
            print('---------------------')
            print('Origin: ' + ride['origin'])
            print('Destination: ' + ride['destination'])
            print('Date: ' + ride['date'])
            print('UID: ' + key)
        print('---------------------')

        uidDelete = str(input('- Type here the UID of the ride you want to unsubscribe: '))
        response = requests.delete(completeURL, params={'uid': uidDelete})
        # check if return codes are okay
        myRides.pop(uidDelete, None)
    elif (menuOption == '3'):
        print('# Looking up rides #')

        origin = str(input('- Origin: '))
        destination = str(input('- Destination: '))
        date = str(input('- Date: '))

        ride = {'origin': origin, 
                'destination': destination, 
                'date': date}

        response = requests.get(baseURL+'/drivers', params=ride)
        responseArray = response.json()

        print()
        for elm in responseArray:
            print('---------------------')
            print('Name: ' + elm['name'])
            print('Phone Number: ' + elm['phoneNum'])
        print('---------------------')
    else:
        print('Invalid menu option')
        