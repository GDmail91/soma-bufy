# 과제 1.  SoMa_Donation

## 백업포유 (Back Up For You: BUFY)
백업포유(BUFY)는 그동안 주변에 눈치채지 못했지만, 도움이 필요한 이웃을 위한 후원 장려 커뮤니티 입니다.
BUFY는 매달 순위를 지정하여 가장 추천과 조회수가 높은 추천 대상에 대해 후원금 및 후원 물품을 전달해 줍니다.
BUFY에서는 도움이 필요한 어린이집, 요양원, 독거노인 뿐만 아니라 더 나아가서 주위 가까운 친구 끼리도 도움이 필요하다면 얼마든지 도와줄 수 있습니다.

- 매달 순위를 매겨 가장 도움이 필요한 곳을 뽑습니다.
- 페이스북에 공유를 하여 사람들에게 알립니다.
- 공유만으로도 후원에 참여할 수 있습니다.
- 공유로 얻은 수익은 대상 단체/개인 에게로 돌아갑니다.
- 도움이 필요한 단체/개인을 홍보하여 그동안 소홀했던 이웃에대한 관심을 늘릴 수 있습니다.

페이스북 공유만으로도 후원이 가능한 BUFY에서 당신의 이웃을 후원을 해주세요.

---
## 서버 기술소개
BUFY에 적용된 기술


### DNS
####[http://bufy.mooo.com](http://bufy.mooo.com)


### Node.js (Express)
#### 라이브러리
- **async(waterfall) :** 동기적 작업을 위해 async의 waterfall 사용
- **aws-sdk :** AWS EC2, S3을 사용하기 위한 아마존 라이브러리
- **firebase :** FCM 사용하기 위한 firebase 라이브러리
- **formidable :** Multipart data를 처리, 클라이언트에서 전송되는 이미지를 다루기 위해 사용
- **gm :** 이미지 처리를 위해 사용(Thumbnail 생성)
- **mysql :** MySQL을 사용하기 위한 MySQL 라이브러리
- **request :** FCM 사용시 FCM 서버에 메세지를 요청하기 위한 라이브러리
- **ua-parser-js :** API 서버이기 때문에 브라우저 접속 차단하기 위한 파서 사용
- **validator :** 유효성 검사


#### DB ER Diagram

![Alt text](http://bufy.mooo.com/ranking/get/image?content_img=bufy_erd.png)


#### MVC 구조
Express 상에서 **MVC**패턴을 적용하였다.
DB에 접속하여 데이터를 가져오기 위한 **Models**
각 요청에 인증 및 적절한 모델과 뷰를 생성해주는 **Controllers**
요청에 맞춰 페이지 생성을 해주는 **Views**
로 구성된다

#### FCM 연동
안드로이드 또는 추후 다른 클라이언트에게 Push 메시지를 전송하기 위하여
**FCM**과 연동하여 **Push**를 전송한다.
**FCM**은 기존 **GCM**과는 달리 클라이언트 ID 뿐만아니라 **Pub/Sub** 구조의 **Topic**을 지원해준다.
여기서 사용한 방법은 **Pub/Sub** 방법으로 각 유저의 **ID** 별 **Topic**을 생성하여 Push를 받을 수 있도록 하였으며,
추후 다른 클라이언트 연동시 동시에 Push를 전송받기 쉽도록 제작하였다.
각 푸시 메시지가 전송될때는 다음과 같은 형태로 전송된다. 
	
	/{category}/{id}
	
- **category :** "ranking" 또는 "monthly"의 이름으로 전송되며 각 카테고리는 클라이언트 측에서 수신시 동작해야할 행동을 정의한다.
- **id :** 각 게시물의 ID로서 행동에 대한 타겟을 설정한다. 

#### S3 스토리지
모든 게시물에는 이미지가 들어간다. 이때 이미지를 저장하기 위한 적절한 공간으로서 **AWS**의 **S3**가 사용되었다.
**S3**사용시 **gm**라이브러리를 사용하여 **Thumbnail**을 동시에 저장한다.
또한 후기로 제작되는 **배너** 또한 **S3**에 저장한다.

#### EC2 인스턴스
**Node.js** 를 운영하기 위한 클라우드 Platform으로서 설치 및 관리가 자유로운 **EC2**를 선택하였으며, 
**Ubuntu** 위에 **Node.js** 를 설치 하여 운용하였다.
각 인스턴스의 부하가 늘어날 경우 확장하기 쉽기 때문에 **BUFY API서버**에 적절한 선택이라고 판단하였다.

#### RDS(MySQL)
데이터베이스를 위한 서비스로서 **AWS**의 **RDS**를 선택하였으며 **MySQL**을 설치하여 운용하였다.

#### 도구
- WebStorm
- PuTTY
- Git/Github
- SourceTree
- MySQL Workbench / HeidiSQL

---
## 서버 API 소개
| NAME				| 메소드		| URL							| 설명					|
| :---------------- | :------------ | :---------------------------- | :-------------------- |
| 유저 등록			| POST			| /user							| 						|
| 유저 정보			| GET			| /user/:user_id				|						|
| 유저 정보 수정	| POST			| /user/:user_id				|						|
| 이달의 후원 등록	| POST			| /monthly						|						|
| 이달의 후원		| GET			| /monthly						|						|
| 랭킹 새글 등록	| POST			| /ranking						|						|
| 랭킹 리스트		| GET			| /ranking						|						|
| 글 자세히 보기	| GET			| /ranking/:content_id			|						|
| 글 수정하기		| PUT			| /ranking/:content_id			|						|
| 글 삭제			| DELETE		| /ranking/:content_id			|						|
| 유저별 글 목록	| GET			| /ranking/user/:user_id		|						|
| 좋아요 등록		| POST			| /ranking/:content_id/likes	|						|
| 좋아요 목록		| GET			| /ranking/likes				|						|
| 글 이미지 다운	| GET			| /ranking/:content_id/image	|						|
| 글 썸네일 다운	| GET			| /ranking/:content_id/thumbnail|						|
| 후기 목록			| GET			| /review						|						|
| 후기 등록			| POST			| /review						|						|
| 후기 수정			| PUT			| /review/:review_id			|						|
| 후기 삭제			| DELETE		| /review/:review_id			|						|
| 후기 글 가져옴	| GET			| /review/:reivew_id			|						|
| 후기 이미지 다운	| GET			| /review/image					|						|
| 문의글 등록		| POST			| /contact						|						|
| 문의글 목록		| GET			| /contact						|						|
| 후원금 PG이체		| GET			| /support/:content_id			|						|
| 알람 목록			| GET			| /alarm						|						|
| 검색 목록			| GET			| /search						|						|
