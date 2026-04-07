const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }

      const text = Buffer.concat(chunks).toString("utf8");

      try {
        resolve(JSON.parse(text));
      } catch {
        resolve(text);
      }
    });
  });

module.exports = async function triggerHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.statusCode = 405;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: {
          code: "method_not_allowed",
          message: "Only POST is supported on this endpoint.",
        },
      }),
    );
    return;
  }

  const body = await readBody(req);

  res.statusCode = 202;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      ok: true,
      queued: true,
      service: "@silver/worker",
      received: body,
    }),
  );
};
