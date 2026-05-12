import os, imghdr
root = r'e:\IWS_Services\kevellMotorServices\userapp\src\assets'
files = [
 'banners/v1.png','banners/v2.png','banners/v3.png','banners/v4.png','banners/v5.png','banners/v6.png',
 'offers/battery_repair.png','offers/free_checkup.png'
]
for f in files:
    p = os.path.join(root, f)
    ok = os.path.exists(p)
    t = imghdr.what(p) if ok else None
    size = os.path.getsize(p) if ok else None
    print(f, 'exists=' + str(ok), 'type=' + str(t), 'size=' + str(size))
