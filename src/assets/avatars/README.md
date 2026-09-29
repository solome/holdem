# 牌友头像

掬一捧直接采用 [solome GitHub](https://github.com/solome) 账号的原头像，保存为 `juyipeng-github.jpg`，未重新绘制。原始下载地址为 `https://avatars.githubusercontent.com/u/2769724?v=4&s=512`。

腾腾、克林、星星、敏敏、旺旺、尖尖的头像通过内置 image_gen 工具生成，以用户提供的同名照片提取少量辨识线索，以 solome 的头像为插画风格参考。根据用户补充方向，以明显的二次元卡通化为主：简化五官、放大眼睛、成块头发、平滑赛璐璐色块，虚多于实。原照片保留在用户提供的头像目录，不复制进项目。

识别特征：腾腾的短立发、露齿笑与黑色外套；克林最新照片中的短齐刘海、无眼镜造型与黄色纸飞机 T 恤；星星的斜向短发、脸部轮廓与黑色卫衣；敏敏的圆眼镜、刘海、长发与白色领口。

背景分别使用鼠尾草绿、暖米色、雾蓝灰、浅紫、浅桃色与浅杏黄；掬一捧保留原图的浅蓝背景。克林在最新原图版本上轻微收窄脸颊。旺旺保留短发、灰色全框眼镜和深色绒领外套的辨识线索。尖尖保留短侧分侧梳黑发、偏瘦鹅蛋脸、无眼镜和浅色连帽卫衣，源文件为无扩展名的 PNG `尖尖`，另以旺旺头像参考统一的插画质感。

| 牌友 | 最终文件 |
| --- | --- |
| 腾腾 | [tengteng-cartoon.png](tengteng-cartoon.png) |
| 克林 | [kelin-cartoon.png](kelin-cartoon.png) |
| 星星 | [xingxing-cartoon.png](xingxing-cartoon.png) |
| 掬一捧 | [juyipeng-github.jpg](juyipeng-github.jpg) |
| 敏敏 | [minmin-cartoon.png](minmin-cartoon.png) |
| 旺旺 | [wangwang-cartoon.png](wangwang-cartoon.png) |
| 尖尖 | [jianjian-cartoon.png](jianjian-cartoon.png) |

完整提示词见 [prompts.json](prompts.json)。生成图保存在本目录，构建时转为内嵌 data URL，页面离线可用。小头像与放大预览使用同一份图片。

牌友玩法特点暂留空，待用户补充后在 `src/review-people.mjs` 的 `traits` 中维护。
