const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");
const { sqlForPartialUpdate } = require("./sql");

describe("createToken", function () {
  test("works: not admin", function () {
    const token = createToken({ username: "test", is_admin: false });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: false,
    });
  });

  test("works: admin", function () {
    const token = createToken({ username: "test", isAdmin: true });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: true,
    });
  });

  test("works: default no admin", function () {
    // given the security risk if this didn't work, checking this specifically
    const token = createToken({ username: "test" });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: false,
    });
  });
});


test('sqlPartialUpdate works', function (){
   const data = {
     apple : 1.00,
     banana : 2.00,
     appleBanana: 3.00
   }

   const book = {
     'appleBanana' : 'apple_banana'
   }

   const res = sqlForPartialUpdate(data, book )

   console.log(res)

   expect(res).toEqual({
     setCols: `"apple"=$1, "banana"=$2, "apple_banana"=$3`,
     values : [1.00,2.00,3.00]
   })
})