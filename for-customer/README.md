# VietTour mobile

This project was imported from `anhtu2302/viet_tour` into the `for-customer` folder inside `deimos0810/Tour-Du-Lich`.

## Run app

```powershell
flutter pub get
flutter run
```

`API_BASE_URL` can be passed at runtime with `--dart-define`. By default the app uses:
- Android Emulator: `http://10.0.2.2:4000/api`
- iOS Simulator: `http://localhost:4000/api`

For a real device, connect the phone and backend to the same LAN and replace the IP with the backend's IPv4 address:

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:4000/api
```

## Authentication and payment

Access/refresh tokens are stored with `flutter_secure_storage`; favorites are stored locally on the device. The VNPay flow opens an external browser and returns to the app by `viettour://payment-result`.

## Check

```powershell
flutter analyze
flutter build apk --debug
```
