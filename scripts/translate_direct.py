#!/usr/bin/env python3
"""Generate translation CSVs directly using hardcoded translations."""
import json, csv, os

with open('src/data/translations/cards.json') as f:
    cards = json.load(f)

# ── Number generators ────────────────────────────────────────────────────────

def thai_num(n):
    ones = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า']
    if n == 0: return 'ศูนย์'
    if n == 100: return 'หนึ่งร้อย'
    td, ud = n // 10, n % 10
    if td == 0: return ones[ud]
    tw = 'สิบ' if td == 1 else ('ยี่สิบ' if td == 2 else ones[td]+'สิบ')
    if ud == 0: return tw
    return tw + ('เอ็ด' if ud == 1 else ones[ud])

ZH1 = ['','一','二','三','四','五','六','七','八','九']
def zh_num(n):
    if n == 0: return '零'
    if n == 100: return '一百'
    td, ud = n // 10, n % 10
    if td == 0: return ZH1[ud]
    tw = '十' if td == 1 else ZH1[td]+'十'
    return tw if ud == 0 else tw+ZH1[ud]

VI1 = ['','một','hai','ba','bốn','năm','sáu','bảy','tám','chín']
def vi_num(n):
    if n == 0: return 'không'
    if n == 100: return 'một trăm'
    td, ud = n // 10, n % 10
    if td == 0: return VI1[ud]
    if td == 1:
        tw = 'mười'
        if ud == 0: return tw
        return tw+' '+('lăm' if ud==5 else VI1[ud])
    tw = VI1[td]+' mươi'
    if ud == 0: return tw
    uw = 'mốt' if ud==1 else ('lăm' if ud==5 else VI1[ud])
    return tw+' '+uw

WORD_TO_N = {
    'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,
    'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,
    'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19,
    'twenty':20,'twenty one':21,'twenty two':22,'twenty three':23,'twenty four':24,
    'twenty five':25,'twenty six':26,'twenty seven':27,'twenty eight':28,'twenty nine':29,
    'thirty':30,'thirty one':31,'thirty two':32,'thirty three':33,'thirty four':34,
    'thirty five':35,'thirty six':36,'thirty seven':37,'thirty eight':38,'thirty nine':39,
    'forty':40,'forty one':41,'forty two':42,'forty three':43,'forty four':44,
    'forty five':45,'forty six':46,'forty seven':47,'forty eight':48,'forty nine':49,
    'fifty':50,'fifty one':51,'fifty two':52,'fifty three':53,'fifty four':54,
    'fifty five':55,'fifty six':56,'fifty seven':57,'fifty eight':58,'fifty nine':59,
    'sixty':60,'sixty one':61,'sixty two':62,'sixty three':63,'sixty four':64,
    'sixty five':65,'sixty six':66,'sixty seven':67,'sixty eight':68,'sixty nine':69,
    'seventy':70,'seventy one':71,'seventy two':72,'seventy three':73,'seventy four':74,
    'seventy five':75,'seventy six':76,'seventy seven':77,'seventy eight':78,'seventy nine':79,
    'eighty':80,'eighty one':81,'eighty two':82,'eighty three':83,'eighty four':84,
    'eighty five':85,'eighty six':86,'eighty seven':87,'eighty eight':88,'eighty nine':89,
    'ninety':90,'ninety one':91,'ninety two':92,'ninety three':93,'ninety four':94,
    'ninety five':95,'ninety six':96,'ninety seven':97,'ninety eight':98,'ninety nine':99,
    'one hundred':100,
}

# ── Vocabulary lookup (english_text -> (th, zh, vi)) ────────────────────────
V = {
    'Apple':('แอปเปิ้ล','苹果','táo'),
    'Banana':('กล้วย','香蕉','chuối'),
    'Beef':('เนื้อวัว','牛肉','thịt bò'),
    'Bread':('ขนมปัง','面包','bánh mì'),
    'Broccoli':('บรอกโคลี','西兰花','bông cải xanh'),
    'Butter':('เนย','黄油','bơ'),
    'Chicken':('ไก่','鸡肉','gà'),
    'Egg':('ไข่','鸡蛋','trứng'),
    'Fish':('ปลา','鱼','cá'),
    'Food':('อาหาร','食物','thức ăn'),
    'Fruit':('ผลไม้','水果','trái cây'),
    'Is this spicy?':('อันนี้เผ็ดไหม?','这个辣吗？','Món này có cay không?'),
    'Jam':('แยม','果酱','mứt'),
    'Mango':('มะม่วง','芒果','xoài'),
    'Noodles':('เส้นก๋วยเตี๋ยว','面条','mì'),
    'Pea':('ถั่วลันเตา','豌豆','đậu Hà Lan'),
    'Peanuts':('ถั่วลิสง','花生','đậu phộng'),
    'Pork':('หมู','猪肉','thịt lợn'),
    'Potato':('มันฝรั่ง','土豆','khoai tây'),
    'Rice':('ข้าว','米饭','cơm'),
    'Salad':('สลัด','沙拉','salad'),
    'Shrimp':('กุ้ง','虾','tôm'),
    'Soup':('ซุป','汤','súp'),
    'Toast':('ขนมปังปิ้ง','吐司','bánh mì nướng'),
    'Vegetables':('ผัก','蔬菜','rau củ'),
    'Allergy':('แพ้','过敏','dị ứng'),
    'Ambulance':('รถพยาบาล','救护车','xe cứu thương'),
    'Call':('โทร','打电话','gọi điện'),
    'Call a doctor':('โทรหาหมอ','叫医生','gọi bác sĩ'),
    'Call the police':('โทรหาตำรวจ','报警','gọi cảnh sát'),
    'Clinic':('คลินิก','诊所','phòng khám'),
    'Danger':('อันตราย','危险','nguy hiểm'),
    'Doctor':('หมอ','医生','bác sĩ'),
    'Emergency':('เหตุฉุกเฉิน','紧急情况','trường hợp khẩn cấp'),
    'Fever':('ไข้','发烧','sốt'),
    'Headache':('ปวดหัว','头痛','đau đầu'),
    'Help':('ช่วยด้วย','帮助','giúp đỡ'),
    'Hospital':('โรงพยาบาล','医院','bệnh viện'),
    'Injury':('บาดเจ็บ','受伤','vết thương'),
    'Insurance':('ประกัน','保险','bảo hiểm'),
    'Medicine':('ยา','药','thuốc'),
    'Pain':('ปวด','疼痛','đau'),
    'Pharmacy':('ร้านขายยา','药店','nhà thuốc'),
    'Safe':('ปลอดภัย','安全','an toàn'),
    'Sick':('ป่วย','生病','ốm'),
    'Stomachache':('ปวดท้อง','胃痛','đau bụng'),
    'Airport':('สนามบิน','机场','sân bay'),
    'Bus':('รถเมล์','公共汽车','xe buýt'),
    'Driver':('คนขับ','司机','tài xế'),
    'Far':('ไกล','远','xa'),
    'Here':('ที่นี่','这里','ở đây'),
    'Left':('ซ้าย','左','trái'),
    'Map':('แผนที่','地图','bản đồ'),
    'Near':('ใกล้','近','gần'),
    'Ride':('นั่ง','乘坐','đi'),
    'Right':('ขวา','右','phải'),
    'Road':('ถนน','路','đường'),
    'Station':('สถานี','车站','ga'),
    'Stop':('หยุด','停','dừng'),
    'Straight':('ตรงไป','直走','đi thẳng'),
    'Street':('ถนน','街道','phố'),
    'Subway':('รถไฟใต้ดิน','地铁','tàu điện ngầm'),
    'Taxi':('แท็กซี่','出租车','taxi'),
    'Ticket':('ตั๋ว','票','vé'),
    'There':('ที่นั่น','那里','ở đó'),
    'Train':('รถไฟ','火车','tàu hỏa'),
    'Turn':('เลี้ยว','转','rẽ'),
    'Bill':('ใบเสร็จ','账单','hóa đơn'),
    'Buy':('ซื้อ','买','mua'),
    'Card':('บัตร','卡','thẻ'),
    'Cash':('เงินสด','现金','tiền mặt'),
    'Change':('เงินทอน','零钱','tiền thối'),
    'Cheap':('ถูก','便宜','rẻ'),
    'Coin':('เหรียญ','硬币','đồng xu'),
    'Cost':('ราคา','费用','giá tiền'),
    'Discount':('ส่วนลด','折扣','giảm giá'),
    'Expensive':('แพง','贵','đắt'),
    'How much is this?':('อันนี้เท่าไหร่?','这个多少钱？','Cái này bao nhiêu tiền?'),
    'Market':('ตลาด','市场','chợ'),
    'Money':('เงิน','钱','tiền'),
    'Pay':('จ่าย','付款','trả tiền'),
    'Price':('ราคา','价格','giá'),
    'Receipt':('ใบเสร็จ','收据','biên lai'),
    'Sale':('ลดราคา','特卖','giảm giá'),
    'Sell':('ขาย','卖','bán'),
    'Shop':('ร้าน','店','cửa hàng'),
    'Store':('ร้านค้า','商店','cửa hàng'),
    'Wallet':('กระเป๋าสตางค์','钱包','ví'),
    'Afternoon':('บ่าย','下午','buổi chiều'),
    'Appointment':('นัดหมาย','预约','cuộc hẹn'),
    'Clock':('นาฬิกา','钟','đồng hồ'),
    'Day':('วัน','天','ngày'),
    'Early':('เร็ว','早','sớm'),
    'Evening':('เย็น','傍晚','buổi tối'),
    'Hour':('ชั่วโมง','小时','giờ'),
    'Late':('สาย','晚','muộn'),
    'Later':('ทีหลัง','稍后','sau'),
    'Minute':('นาที','分钟','phút'),
    'Morning':('เช้า','早上','buổi sáng'),
    'Night':('กลางคืน','晚上','ban đêm'),
    'Now':('ตอนนี้','现在','bây giờ'),
    'Schedule':('ตารางเวลา','日程','lịch trình'),
    'Second':('วินาที','秒','giây'),
    'Time':('เวลา','时间','thời gian'),
    'Today':('วันนี้','今天','hôm nay'),
    'Tomorrow':('พรุ่งนี้','明天','ngày mai'),
    'Week':('สัปดาห์','星期','tuần'),
    'Yesterday':('เมื่อวาน','昨天','hôm qua'),
    'Clothes':('เสื้อผ้า','衣服','quần áo'),
    'Door':('ประตู','门','cửa'),
    'Home':('บ้าน','家','nhà'),
    'House':('บ้าน','房子','nhà'),
    'Phone':('โทรศัพท์','手机','điện thoại'),
    'Room':('ห้อง','房间','phòng'),
    'Sleep':('นอน','睡觉','ngủ'),
    'Window':('หน้าต่าง','窗户','cửa sổ'),
    'Air conditioning':('แอร์','空调','điều hòa'),
    'Bathroom':('ห้องน้ำ','浴室','phòng tắm'),
    'Bed':('เตียง','床','giường'),
    'Booking':('การจอง','预订','đặt phòng'),
    'Check-in':('เช็คอิน','入住','nhận phòng'),
    'Check-out':('เช็คเอาท์','退房','trả phòng'),
    'Elevator':('ลิฟต์','电梯','thang máy'),
    'Guest':('แขก','客人','khách'),
    'Hostel':('โฮสเทล','青年旅舍','nhà nghỉ'),
    'Hotel':('โรงแรม','酒店','khách sạn'),
    'Key':('กุญแจ','钥匙','chìa khóa'),
    'Lobby':('ล็อบบี้','大厅','sảnh'),
    'Reception':('แผนกต้อนรับ','前台','lễ tân'),
    'Reservation':('การจอง','预约','đặt chỗ'),
    'Shower':('ฝักบัว','淋浴','vòi hoa sen'),
    'Stairs':('บันได','楼梯','cầu thang'),
    'Toilet':('ห้องน้ำ','厕所','nhà vệ sinh'),
    'Towel':('ผ้าขนหนู','毛巾','khăn tắm'),
    'Wi-Fi':('ไวไฟ','无线网络','Wi-Fi'),
    'Blueberry':('บลูเบอร์รี่','蓝莓','việt quất'),
    'Cherry':('เชอร์รี่','樱桃','anh đào'),
    'Coconut':('มะพร้าว','椰子','dừa'),
    'Dragon fruit':('แก้วมังกร','火龙果','thanh long'),
    'Grapes':('องุ่น','葡萄','nho'),
    'Guava':('ฝรั่ง','番石榴','ổi'),
    'Kiwi':('กีวี่','奇异果','kiwi'),
    'Lemon':('มะนาว','柠檬','chanh vàng'),
    'Lime':('มะนาว','青柠','chanh'),
    'Orange':('ส้ม','橙子','cam'),
    'Papaya':('มะละกอ','木瓜','đu đủ'),
    'Passion fruit':('เสาวรส','百香果','chanh dây'),
    'Peach':('พีช','桃子','đào'),
    'Pear':('สาลี่','梨','lê'),
    'Pineapple':('สับปะรด','菠萝','dứa'),
    'Strawberry':('สตรอว์เบอร์รี่','草莓','dâu tây'),
    'Watermelon':('แตงโม','西瓜','dưa hấu'),
    'Bell pepper':('พริกหยวก','甜椒','ớt chuông'),
    'Cabbage':('กะหล่ำปลี','卷心菜','bắp cải'),
    'Carrot':('แครอท','胡萝卜','cà rốt'),
    'Chili pepper':('พริก','辣椒','ớt'),
    'Corn':('ข้าวโพด','玉米','ngô'),
    'Cucumber':('แตงกวา','黄瓜','dưa chuột'),
    'Eggplant':('มะเขือ','茄子','cà tím'),
    'Garlic':('กระเทียม','大蒜','tỏi'),
    'Green beans':('ถั่วฝักยาว','四季豆','đậu que'),
    'Lettuce':('ผักกาดหอม','生菜','rau diếp'),
    'Mushroom':('เห็ด','蘑菇','nấm'),
    'Onion':('หัวหอม','洋葱','hành tây'),
    'Peas':('ถั่วลันเตา','豌豆','đậu Hà Lan'),
    'Pumpkin':('ฟักทอง','南瓜','bí ngô'),
    'Spinach':('ผักโขม','菠菜','rau bina'),
    'Sweet potato':('มันเทศ','红薯','khoai lang'),
    'Tomato':('มะเขือเทศ','番茄','cà chua'),
    'Zucchini':('ซูกินี','西葫芦','bí xanh'),
    'Boss':('เจ้านาย','老板','sếp'),
    'Client':('ลูกค้า','客户','khách hàng'),
    'Company':('บริษัท','公司','công ty'),
    'Contract':('สัญญา','合同','hợp đồng'),
    'Deadline':('กำหนดส่งงาน','截止日期','hạn chót'),
    'Email':('อีเมล','电子邮件','email'),
    'Employee':('พนักงาน','员工','nhân viên'),
    'Experience':('ประสบการณ์','经验','kinh nghiệm'),
    'Interview':('สัมภาษณ์','面试','phỏng vấn'),
    'Job':('งาน','工作','công việc'),
    'Manager':('ผู้จัดการ','经理','quản lý'),
    'Meeting':('ประชุม','会议','cuộc họp'),
    'Office':('สำนักงาน','办公室','văn phòng'),
    'Project':('โครงการ','项目','dự án'),
    'Promotion':('การเลื่อนตำแหน่ง','晋升','thăng tiến'),
    'Resume':('ประวัติย่อ','简历','hồ sơ xin việc'),
    'Salary':('เงินเดือน','薪水','lương'),
    'Skill':('ทักษะ','技能','kỹ năng'),
    'Task':('งาน','任务','nhiệm vụ'),
    'Work':('ทำงาน','工作','làm việc'),
    'Boyfriend':('แฟน','男朋友','bạn trai'),
    'Conversation':('การสนทนา','对话','cuộc trò chuyện'),
    'Dance':('เต้นรำ','跳舞','khiêu vũ'),
    'Drink':('ดื่ม','喝','uống'),
    'Friend':('เพื่อน','朋友','bạn bè'),
    'Girlfriend':('แฟน','女朋友','bạn gái'),
    'Hang out':('เที่ยว','出去玩','đi chơi'),
    'Hobby':('งานอดิเรก','爱好','sở thích'),
    'Invite':('เชิญ','邀请','mời'),
    'Laugh':('หัวเราะ','笑','cười'),
    'Like':('ชอบ','喜欢','thích'),
    'Love':('รัก','爱','yêu'),
    'Meet':('พบ','见面','gặp mặt'),
    'Message':('ข้อความ','信息','tin nhắn'),
    'Music':('ดนตรี','音乐','âm nhạc'),
    'Party':('งานปาร์ตี้','派对','bữa tiệc'),
    'Relationship':('ความสัมพันธ์','关系','mối quan hệ'),
    'Smile':('ยิ้ม','微笑','nụ cười'),
    'Bowl':('ชาม','碗','bát'),
    'Chopsticks':('ตะเกียบ','筷子','đũa'),
    'Cup':('ถ้วย','杯子','cốc'),
    'Fork':('ส้อม','叉子','dĩa'),
    'Glass':('แก้ว','玻璃杯','ly thủy tinh'),
    'Knife':('มีด','刀','dao'),
    'Napkin':('ผ้าเช็ดปาก','餐巾纸','khăn giấy'),
    'Plate':('จาน','盘子','đĩa'),
    'Serving spoon':('ทัพพี','汤勺','muỗng phục vụ'),
    'Spoon':('ช้อน','勺子','thìa'),
    'Teapot':('กาน้ำชา','茶壶','ấm trà'),
    'Beer':('เบียร์','啤酒','bia'),
    'Coffee':('กาแฟ','咖啡','cà phê'),
    'Juice':('น้ำผลไม้','果汁','nước ép'),
    'Milk':('นม','牛奶','sữa'),
    'Tea':('ชา','茶','trà'),
    'Water':('น้ำ','水','nước'),
    'Good afternoon':('สวัสดีตอนบ่าย','下午好','Buổi chiều tốt lành'),
    'Good evening':('สวัสดีตอนเย็น','晚上好','Buổi tối tốt lành'),
    'Good morning':('สวัสดีตอนเช้า','早上好','Chào buổi sáng'),
    'Hello':('สวัสดี','你好','Xin chào'),
    'Hi':('สวัสดี','嗨','Chào'),
    'Goodbye':('ลาก่อน','再见','Tạm biệt'),
    'Have a nice day':('ขอให้วันดี','祝你有美好的一天','Chúc một ngày tốt lành'),
    'See you later':('แล้วเจอกัน','再见','Hẹn gặp lại'),
    'See you tomorrow':('แล้วเจอกันพรุ่งนี้','明天见','Hẹn gặp ngày mai'),
    'Take care':('ดูแลตัวเองด้วย','保重','Bảo trọng'),
    'My name is...':('ฉันชื่อ...','我叫...','Tên tôi là...'),
    'Nice to meet you':('ยินดีที่ได้รู้จัก','很高兴认识你','Rất vui được gặp bạn'),
    "What's your name?":('คุณชื่ออะไร?','你叫什么名字？','Tên bạn là gì?'),
    'No':('ไม่','不','Không'),
    'Yes':('ใช่','是','Có'),
    'Please':('กรุณา','请','Làm ơn'),
    'Thank you':('ขอบคุณ','谢谢','Cảm ơn'),
    'What time does it close?':('ปิดกี่โมง?','几点关门？','Mấy giờ đóng cửa?'),
    'What time does it open?':('เปิดกี่โมง?','几点开门？','Mấy giờ mở cửa?'),
    'Do you live here?':('คุณอาศัยอยู่ที่นี่ไหม?','你住在这里吗？','Bạn sống ở đây không?'),
    'How are you?':('คุณเป็นอย่างไรบ้าง?','你好吗？','Bạn có khỏe không?'),
    'How old are you?':('คุณอายุเท่าไหร่?','你多大了？','Bạn bao nhiêu tuổi?'),
    'I am ___ years old':('ฉันอายุ ___ ปี','我___岁','Tôi ___ tuổi'),
    'I work as a ___':('ฉันทำงานเป็น ___','我是___','Tôi làm nghề ___'),
    "I'm fine, thank you":('ฉันสบายดี ขอบคุณ','我很好，谢谢','Tôi khỏe, cảm ơn'),
    "I'm from Canada":('ฉันมาจากแคนาดา','我来自加拿大','Tôi đến từ Canada'),
    "I'm good":('ฉันสบายดี','我很好','Tôi ổn'),
    "I'm just visiting":('ฉันแค่มาท่องเที่ยว','我只是来旅游的','Tôi chỉ đến tham quan'),
    'What do you do?':('คุณทำอะไร?','你做什么工作？','Bạn làm nghề gì?'),
    'Where are you from?':('คุณมาจากไหน?','你从哪里来？','Bạn đến từ đâu?'),
    'One ticket, please':('ขอตั๋วหนึ่งใบ','请给我一张票','Cho tôi một vé'),
    'Where can I buy tickets?':('ซื้อตั๋วได้ที่ไหน?','在哪里可以买票？','Tôi có thể mua vé ở đâu?'),
    'Where is the bus stop?':('ป้ายรถเมล์อยู่ที่ไหน?','公共汽车站在哪里？','Điểm xe buýt ở đâu?'),
    'Where is the train station?':('สถานีรถไฟอยู่ที่ไหน?','火车站在哪里？','Ga tàu ở đâu?'),
    'Can I have the menu?':('ขอดูเมนูได้ไหม?','请给我看一下菜单','Cho tôi xem thực đơn'),
    'The bill, please':('คิดเงินด้วย','买单','Tính tiền cho tôi'),
    'Water, please':('ขอน้ำด้วย','请给我水','Cho tôi nước'),
    'Can you help me?':('คุณช่วยฉันได้ไหม?','你能帮助我吗？','Bạn có thể giúp tôi không?'),
    'Do you speak English?':('คุณพูดภาษาอังกฤษได้ไหม?','你会说英语吗？','Bạn có nói được tiếng Anh không?'),
    'Excuse me':('ขอโทษ','打扰一下','Xin lỗi'),
    'How do I get there?':('ไปที่นั่นได้อย่างไร?','怎么去那里？','Làm thế nào để đến đó?'),
    'I am lost':('ฉันหลงทาง','我迷路了','Tôi bị lạc đường'),
    'I do not understand':('ฉันไม่เข้าใจ','我不明白','Tôi không hiểu'),
    'I need help':('ฉันต้องการความช่วยเหลือ','我需要帮助','Tôi cần giúp đỡ'),
    'I would like this':('ฉันต้องการอันนี้','我要这个','Tôi muốn cái này'),
    'Is there Wi-Fi?':('มีไวไฟไหม?','有Wi-Fi吗？','Ở đây có Wi-Fi không?'),
    'No spicy':('ไม่เผ็ด','不要辣','Không cay'),
    'Sorry':('ขอโทษ','对不起','Xin lỗi'),
    'What is the password?':('รหัสผ่านคืออะไร?','密码是多少？','Mật khẩu là gì?'),
    'Police':('ตำรวจ','警察','cảnh sát'),
    'Watch':('นาฬิกาข้อมือ','手表','đồng hồ đeo tay'),
    'Where is the bathroom?':('ห้องน้ำอยู่ที่ไหน?','洗手间在哪里？','Nhà vệ sinh ở đâu?'),
    'Development':('การพัฒนา','发展','phát triển'),
    'Education':('การศึกษา','教育','giáo dục'),
    'Opportunity':('โอกาส','机会','cơ hội'),
    'Responsibility':('ความรับผิดชอบ','责任','trách nhiệm'),
    'Understanding':('ความเข้าใจ','理解','sự hiểu biết'),
}

# Category-specific overrides for ambiguous words
CAT_OVERRIDE = {
    ('Date','social'):     ('นัด','约会','hẹn hò'),
    ('Date','time'):       ('วันที่','日期','ngày tháng'),
    ('Safe','accommodation'): ('ตู้เซฟ','保险箱','két an toàn'),
}

def get_translation(english_text, category):
    key = (english_text, category)
    if key in CAT_OVERRIDE:
        return CAT_OVERRIDE[key]
    if english_text in V:
        return V[english_text]
    # Try digit number
    try:
        n = int(english_text)
        if 0 <= n <= 100:
            return (thai_num(n), zh_num(n), vi_num(n))
    except ValueError:
        pass
    # Try word number
    lower = english_text.lower()
    if lower in WORD_TO_N:
        n = WORD_TO_N[lower]
        return (thai_num(n), zh_num(n), vi_num(n))
    return None

os.makedirs('src/data/translations', exist_ok=True)
langs = ['th', 'zh', 'vi']
lang_idx = {'th': 0, 'zh': 1, 'vi': 2}
writers = {}
files = {}

for lang in langs:
    f = open(f'src/data/translations/{lang}_review.csv', 'w', newline='', encoding='utf-8')
    files[lang] = f
    w = csv.writer(f, quoting=csv.QUOTE_ALL)
    w.writerow(['flashcard_id','english_text','category','native_text','flagged'])
    writers[lang] = w

missing = []
for card in cards:
    t = get_translation(card['english_text'], card['category'])
    if t is None:
        missing.append(card)
        for lang in langs:
            writers[lang].writerow([card['id'], card['english_text'], card['category'] or '', '?MISSING', 'true'])
    else:
        for lang in langs:
            writers[lang].writerow([card['id'], card['english_text'], card['category'] or '', t[lang_idx[lang]], 'false'])

for f in files.values():
    f.close()

print(f'Done. {len(cards)} cards processed, {len(missing)} missing.')
if missing:
    for m in missing:
        print(f"  MISSING: {m['english_text']!r} ({m['category']})")
