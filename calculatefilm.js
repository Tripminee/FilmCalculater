document.getElementById('glassForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const FILM_WIDTH = 60; // ฟิล์มกว้าง 60 ซม.

  // รับค่าจาก input
  let glasses = [
  { name: "บานหน้า", width: +document.getElementById('front_width').value, height: +document.getElementById('front_height').value },
  { name: "กระจกคู่หน้า (ซ้าย)", width: +document.getElementById('frontPair_width').value, height: +document.getElementById('frontPair_height').value },
  { name: "กระจกคู่หน้า (ขวา)", width: +document.getElementById('frontPair_width').value, height: +document.getElementById('frontPair_height').value },
  { name: "กระจกคู่หลัง (ซ้าย)", width: +document.getElementById('rearPair_width').value, height: +document.getElementById('rearPair_height').value },
  { name: "กระจกคู่หลัง (ขวา)", width: +document.getElementById('rearPair_width').value, height: +document.getElementById('rearPair_height').value },
  { name: "บานหลัง", width: +document.getElementById('rear_width').value, height: +document.getElementById('rear_height').value }
];
// Sunroof (1 บาน)
let sunroof_w = +document.getElementById('sunroof_width').value;
let sunroof_h = +document.getElementById('sunroof_height').value;
if(sunroof_w > 0 && sunroof_h > 0) {
  glasses.push({ name: "Sunroof", width: sunroof_w, height: sunroof_h });
}

 // ฟังก์ชันนี้ควรใช้กับ "กลุ่มละ 3 บาน" (แนะนำ)
  // สมมติบานหน้า + คู่หน้าซ้าย + คู่หน้าขวา
  const group1 = [glasses[0], glasses[1], glasses[2]];
  // สมมติบานหลัง + คู่หลังซ้าย + คู่หลังขวา
  const group2 = [glasses[5], glasses[3], glasses[4]];

  // Optimize ทีละกลุ่ม
  let result1 = findBestSheetFor3(group1, FILM_WIDTH); // อาจคืน 1 หรือ 2/3 แผ่น
  let result2 = findBestSheetFor3(group2, FILM_WIDTH);

  // Sunroof (หรืออื่น ๆ ที่ไม่ได้เข้ากลุ่ม 3)
  let extras = [];
  if (glasses.length > 6) {
    // อาจมี sunroof เป็นบานเดียว
    extras = [{
      usedFor: [glasses[6].name + ` (${glasses[6].width}" x ${glasses[6].height}")`],
      cut: `${glasses[6].height} x ${FILM_WIDTH}`,
      length: glasses[6].height
    }];
  }

  // รวมผลลัพธ์ทั้งหมด
  let allSheets = [...result1, ...result2, ...extras];

  // --- แสดงผล ---
  let totalLength = allSheets.reduce((sum, s) => sum + s.length, 0);

  // กรอง input ผิดพลาด (เผื่อ user ไม่กรอกบางช่อง)
  //glasses = glasses.map(g => ({...g, origWidth: g.width, origHeight: g.height}));

  // เรียกฟังก์ชัน pack
  //let result = findBestSheetFor3(group, FILM_WIDTH);

  // --- แสดงผล ---
let out = `<div class="font-semibold text-lg mb-2">ผลลัพธ์การวางฟิล์ม:</div>`;
out += `<ul class="list-decimal ml-6">`;
allSheets.forEach((sheet, idx) => {
  out += `<li class="mb-2"><b>แผ่นที่ ${idx+1}</b>:`;
  out += `<ul class="list-disc ml-6">`;
  sheet.usedFor.forEach(b => out += `<li>${b}</li>`);
  out += `</ul>`;
  out += `ตัดฟิล์มยาว <b>${sheet.length}</b> นิ้ว (กว้าง 60 นิ้ว)</li>`;
});
out += `</ul>`;
out += `<div class="mt-2">รวมต้องใช้ฟิล์ม <span class="text-red-600 font-bold">${allSheets.length}</span> แผ่น<br>`;
out += `รวมความยาวฟิล์ม <span class="text-blue-600 font-bold">${totalLength}</span> นิ้ว หรือ <span class="text-blue-600 font-bold">${((totalLength * 60) / 144).toFixed(2)}</span> ฟุต</div>`;
document.getElementById('filmResult').innerHTML = out;
});

function findBestSheetFor3(group, FILM_WIDTH) {
  let best = null;
  for (let i = 0; i < 8; i++) { // 2^3 = 8 แบบ (หมุน)
    let g = group.map((x, idx) => {
      let rotated = (i & (1 << idx)) ? true : false;
      return {
        ...x,
        width: rotated ? x.height : x.width,
        height: rotated ? x.width : x.height,
        rotated
      }
    });
    let sumWidth = g[0].width + g[1].width + g[2].width;
    let maxHeight = Math.max(g[0].height, g[1].height, g[2].height);
    if (sumWidth <= FILM_WIDTH) {
      if (!best || maxHeight < best.length) {
        best = {
          usedFor: g.map(x =>
            `${x.name} (${x.width}" x ${x.height}"${x.rotated ? ", หมุนแนว" : ""})`
          ),
          cut: `${maxHeight} x ${FILM_WIDTH}`,
          length: maxHeight
        };
      }
    }
  }
  // fallback ถ้า 3 บานลงไม่ได้ ให้ลองจับคู่ 2 หรือ 1
  if (!best) {
    // หาคู่ที่ดีที่สุดก่อน
    let best2 = null;
    for (let i = 0; i < 3; i++) for (let j = i+1; j < 3; j++) {
      for (let rot = 0; rot < 4; rot++) {
        let gi = (rot&1)? { ...group[i], width: group[i].height, height: group[i].width, rotated: true } : { ...group[i], rotated: false };
        let gj = (rot&2)? { ...group[j], width: group[j].height, height: group[j].width, rotated: true } : { ...group[j], rotated: false };
        let sw = gi.width + gj.width;
        let mh = Math.max(gi.height, gj.height);
        if (sw <= FILM_WIDTH) {
          if (!best2 || mh < best2.length) {
            best2 = {
              usedFor: [
                `${gi.name} (${gi.width}" x ${gi.height}"${gi.rotated ? ", หมุนแนว" : ""})`,
                `${gj.name} (${gj.width}" x ${gj.height}"${gj.rotated ? ", หมุนแนว" : ""})`
              ],
              cut: `${mh} x ${FILM_WIDTH}`,
              length: mh
            };
          }
        }
      }
    }
    if (best2) {
      // หาบานเดี่ยวที่เหลือ
      let k = [0,1,2].filter(x =>
        !best2.usedFor[0].includes(group[x].name) &&
        !best2.usedFor[1].includes(group[x].name)
      )[0];
      let gk = group[k];
      let single = {
        usedFor: [
          `${gk.name} (${gk.width}" x ${gk.height}")`
        ],
        cut: `${gk.height} x ${FILM_WIDTH}`,
        length: gk.height
      };
      return [best2, single];
    } else {
      // เดี่ยวหมด
      return group.map(g => ({
        usedFor: [
          `${g.name} (${g.width}" x ${g.height}")`
        ],
        cut: `${g.height} x ${FILM_WIDTH}`,
        length: g.height
      }));
    }
  }
  return [best];
}