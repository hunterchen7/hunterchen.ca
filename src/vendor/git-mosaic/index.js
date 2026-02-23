import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/data/gitHistory.json
var stats = {
	"totalCommits": 1613,
	"totalContributionDays": 230,
	"dateRange": {
		"from": "2025-02-06",
		"to": "2026-01-31"
	},
	"hourDistribution": [
		39,
		45,
		97,
		131,
		139,
		96,
		37,
		24,
		11,
		10,
		26,
		34,
		61,
		62,
		85,
		65,
		59,
		74,
		79,
		85,
		108,
		100,
		94,
		52
	],
	"dayDistribution": [
		199,
		220,
		256,
		258,
		234,
		216,
		230
	],
	"fetchDuration": "1.10s",
	"fetchTimestamp": "2026-01-31T23:51:09.931Z"
};
var commits = [
	{
		"date": "2025-02-06",
		"hour": 12,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-07",
		"hour": 13,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-02-07",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-02-07",
		"hour": 1,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-02-07",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-02-08",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-02-08",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-02-08",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-02-08",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-02-11",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-02-13",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-13",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-13",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-18",
		"hour": 7,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-02-18",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-02-18",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-02-25",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-02-27",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-27",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-27",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-27",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-27",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-03",
		"hour": 10,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-03",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-06",
		"hour": 13,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-06",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-06",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-06",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-06",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-07",
		"hour": 6,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-03-10",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-10",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-10",
		"hour": 12,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-10",
		"hour": 6,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-10",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-10",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-11",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-11",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-11",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-11",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-11",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-11",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-11",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-12",
		"hour": 10,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-03-12",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-03-13",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-13",
		"hour": 0,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-13",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-13",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-14",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-03-14",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-03-14",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-03-14",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-03-15",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-03-15",
		"hour": 23,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-03-15",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-03-15",
		"hour": 15,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-03-15",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-03-18",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-20",
		"hour": 19,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-20",
		"hour": 6,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-20",
		"hour": 23,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-26",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-03-26",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-03-26",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-03-26",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-03-26",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-03-27",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-27",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-27",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-27",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-27",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-03-29",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-03-30",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-03-30",
		"hour": 7,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-03-31",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-03-31",
		"hour": 13,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-01",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-01",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-02",
		"hour": 8,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 6,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 9,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 8,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 6,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 15,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-02",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-03",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 23,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 7,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 13,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 9,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 13,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-03",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-04",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 16,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 23,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-04",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-05",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-05",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-05",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-05",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-05",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-05",
		"hour": 11,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-05",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-05",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-06",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-06",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-06",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-06",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-07",
		"hour": 11,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-07",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-07",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-07",
		"hour": 13,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-09",
		"hour": 6,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-09",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-09",
		"hour": 11,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-09",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-09",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-09",
		"hour": 16,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-17",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-18",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-18",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-18",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-18",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-18",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-18",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-19",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-19",
		"hour": 11,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-20",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 18,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 16,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 16,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 8,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 23,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-20",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-21",
		"hour": 11,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 11,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 1,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 19,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 6,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 9,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 12,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 1,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 12,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 1,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-21",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-22",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 11,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 6,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-22",
		"hour": 1,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-23",
		"hour": 1,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 11,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 10,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 6,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 15,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-23",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-24",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-24",
		"hour": 19,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-24",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-25",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-25",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-25",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-25",
		"hour": 9,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-25",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-25",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-25",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-04-26",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-27",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 23,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 18,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 18,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 11,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-27",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-04-28",
		"hour": 1,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 6,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 22,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 1,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 22,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 10,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-28",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-04-29",
		"hour": 16,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 6,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 10,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 1,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-29",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-04-30",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 0,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 1,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-04-30",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-01",
		"hour": 23,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-01",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-01",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-01",
		"hour": 0,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-01",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-01",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-02",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-02",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-02",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-02",
		"hour": 7,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-02",
		"hour": 1,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-02",
		"hour": 10,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-03",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 15,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 13,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 1,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-03",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-04",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 6,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 6,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 23,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 23,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 8,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 6,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 6,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 16,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 0,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-04",
		"hour": 1,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-05",
		"hour": 8,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 9,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 19,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 19,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 19,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 19,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 23,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 11,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 13,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-05",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-06",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-06",
		"hour": 16,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-06",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-06",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-06",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-06",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-06",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-06",
		"hour": 11,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-07",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 10,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 16,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-07",
		"hour": 1,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-08",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 11,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 0,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-08",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-09",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 11,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 0,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 0,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 18,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-09",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-10",
		"hour": 17,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-10",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-10",
		"hour": 10,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-11",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-11",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-11",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-11",
		"hour": 18,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-11",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-11",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-14",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-14",
		"hour": 1,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-14",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-14",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-14",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-14",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-15",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-15",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-15",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-15",
		"hour": 13,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-15",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-16",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-16",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-16",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-16",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-16",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-16",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-16",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-17",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-17",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-17",
		"hour": 23,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-17",
		"hour": 23,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-17",
		"hour": 17,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-17",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-17",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-17",
		"hour": 17,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-17",
		"hour": 13,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-18",
		"hour": 17,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 8,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 6,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 13,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-18",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-19",
		"hour": 13,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-20",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-20",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-20",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-20",
		"hour": 9,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-20",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-20",
		"hour": 11,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-20",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-20",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-22",
		"hour": 11,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-22",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-22",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-22",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-22",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-22",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-22",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-23",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-23",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-24",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-24",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-24",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-24",
		"hour": 23,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-24",
		"hour": 11,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-24",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-05-25",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-25",
		"hour": 17,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-25",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-05-26",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 19,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 10,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 23,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 23,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 11,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-26",
		"hour": 23,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-27",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-27",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-27",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-27",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-27",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-27",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-27",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-05-28",
		"hour": 6,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-28",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-05-29",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-30",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-30",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-30",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-30",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-30",
		"hour": 6,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-05-31",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-02",
		"hour": 23,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-02",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-02",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-02",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-02",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-03",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 7,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 10,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-03",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-04",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-04",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-04",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-05",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-05",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-05",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-06",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-09",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-09",
		"hour": 10,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-10",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-10",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-10",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-10",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-10",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-11",
		"hour": 10,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-11",
		"hour": 15,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-12",
		"hour": 11,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-12",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-13",
		"hour": 13,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-14",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-14",
		"hour": 0,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-14",
		"hour": 16,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-16",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-16",
		"hour": 22,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-18",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-18",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-18",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-18",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-18",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-18",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-18",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-18",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-19",
		"hour": 13,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-19",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-19",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-19",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-19",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-19",
		"hour": 13,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-19",
		"hour": 13,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-19",
		"hour": 12,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-19",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-20",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 13,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-20",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-21",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-21",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-21",
		"hour": 6,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-21",
		"hour": 0,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-21",
		"hour": 23,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-22",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 13,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 11,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-22",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-23",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-23",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-23",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-23",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-24",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-25",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-25",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-25",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-06-26",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 6,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-26",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-06-27",
		"hour": 7,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-27",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-27",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-29",
		"hour": 18,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-29",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-06-30",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-30",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-30",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-06-30",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-01",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-05",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-07-05",
		"hour": 16,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-07-07",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-07",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-07",
		"hour": 23,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-07",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-08",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-08",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-11",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-07-11",
		"hour": 10,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-07-15",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-16",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-16",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-16",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-17",
		"hour": 19,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-17",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-17",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-17",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-17",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-18",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-07-18",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-07-18",
		"hour": 8,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-07-19",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-07-19",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-07-20",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-20",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-20",
		"hour": 17,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-20",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-20",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-21",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 19,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 12,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 13,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-21",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-22",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-22",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-22",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-22",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-22",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-22",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-22",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-22",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-23",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-26",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-07-27",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 6,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 7,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 16,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 18,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 7,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-27",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-07-28",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 22,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 11,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-28",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-07-29",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 11,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-29",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-30",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 16,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 16,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-30",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-31",
		"hour": 10,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-31",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-31",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-31",
		"hour": 13,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-31",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-07-31",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-08-01",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-02",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-08-04",
		"hour": 13,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-08-04",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-08-04",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-08-04",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-08-05",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-05",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-05",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-05",
		"hour": 6,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-11",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-08-12",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-12",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-12",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-12",
		"hour": 11,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-12",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-12",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-12",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-13",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-08-14",
		"hour": 12,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-08-14",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-08-14",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-08-15",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-15",
		"hour": 7,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-15",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-15",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-15",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-15",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-15",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-15",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-15",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-18",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-08-26",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-26",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-26",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-26",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-26",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-26",
		"hour": 23,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-08-27",
		"hour": 1,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-08-27",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-08-31",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-08-31",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-08-31",
		"hour": 16,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-08-31",
		"hour": 11,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-08-31",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-08-31",
		"hour": 23,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-08-31",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-02",
		"hour": 1,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-03",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-03",
		"hour": 6,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-04",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-04",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-06",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 23,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 16,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 1,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 0,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 6,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 1,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-06",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-07",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 18,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 1,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 7,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-07",
		"hour": 1,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-08",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-08",
		"hour": 1,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-08",
		"hour": 12,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-08",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-08",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-08",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-08",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-08",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-08",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-09",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-09",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-09",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-09",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-10",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 16,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 15,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 7,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 6,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 8,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-10",
		"hour": 0,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-11",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-11",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-12",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 7,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-12",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-13",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 8,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-13",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-14",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-14",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-14",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-14",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-14",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-14",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-14",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-15",
		"hour": 1,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-16",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-16",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-17",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-17",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-17",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-17",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-17",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-18",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-18",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-18",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-18",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-18",
		"hour": 9,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-18",
		"hour": 19,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-18",
		"hour": 11,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-18",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-18",
		"hour": 7,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-19",
		"hour": 11,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-19",
		"hour": 0,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-20",
		"hour": 0,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-20",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-20",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-20",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-20",
		"hour": 7,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-21",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-21",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-21",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-21",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-21",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-21",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-09-22",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-22",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-22",
		"hour": 22,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-22",
		"hour": 6,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-22",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-22",
		"hour": 11,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-23",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 12,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-23",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-24",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-24",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-09-25",
		"hour": 7,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-25",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-25",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-25",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-25",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-25",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-09-26",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-26",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-09-27",
		"hour": 23,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-27",
		"hour": 7,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-27",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-27",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-27",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-09-29",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-29",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-29",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-29",
		"hour": 11,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-29",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-30",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-30",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-30",
		"hour": 16,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-30",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-01",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-01",
		"hour": 10,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-01",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-01",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-01",
		"hour": 12,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-01",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-02",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 7,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 0,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 12,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 10,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-02",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-03",
		"hour": 18,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 23,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 10,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-03",
		"hour": 13,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-04",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 13,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 16,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 13,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 15,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 15,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 11,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 13,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 15,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 0,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 17,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 1,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 15,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 9,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 10,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 13,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 23,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 7,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 15,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 16,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 11,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-04",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-05",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 18,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 16,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 16,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-05",
		"hour": 1,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-07",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-07",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-07",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-07",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-08",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 0,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 0,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 11,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-08",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-09",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 6,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 7,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 6,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 6,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 6,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 10,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 23,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 19,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 23,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-09",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-10",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 23,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 10,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 13,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 16,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 16,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 1,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 1,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 0,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-10",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-11",
		"hour": 12,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 17,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 0,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 3,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 16,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-11",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-12",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-12",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-12",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-12",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-13",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-14",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-14",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-14",
		"hour": 13,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-15",
		"hour": 1,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-15",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-16",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-16",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-16",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-16",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-19",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-19",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-19",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-19",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-19",
		"hour": 23,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-19",
		"hour": 23,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-10-20",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-21",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-22",
		"hour": 8,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-22",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-22",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-24",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-24",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-10-25",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-27",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-27",
		"hour": 12,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-27",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-27",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-27",
		"hour": 7,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-27",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-29",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-30",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-30",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-10-31",
		"hour": 0,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-03",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-03",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-03",
		"hour": 23,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-03",
		"hour": 13,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-04",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-10",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-10",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-10",
		"hour": 16,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-10",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-10",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-10",
		"hour": 10,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-10",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-11",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-11",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-11",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-11",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-11",
		"hour": 6,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-11",
		"hour": 7,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-14",
		"hour": 19,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-15",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-11-16",
		"hour": 5,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-11-16",
		"hour": 22,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-11-16",
		"hour": 2,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-11-18",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-19",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-11-19",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-11-19",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-11-19",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-11-19",
		"hour": 16,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-11-19",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-11-19",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-11-20",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-11-20",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-11-20",
		"hour": 8,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-11-20",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-11-20",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-11-20",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-11-20",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-11-21",
		"hour": 23,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-21",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-21",
		"hour": 16,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-21",
		"hour": 7,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-21",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-21",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-21",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-21",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-22",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2025-11-24",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-24",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-11-24",
		"hour": 21,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-12-03",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-12-04",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-12-05",
		"hour": 0,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-12-08",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2025-12-10",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-12-11",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2025-12-14",
		"hour": 23,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2025-12-17",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-12-17",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-12-17",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-12-17",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2025-12-19",
		"hour": 9,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-12-19",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-12-19",
		"hour": 18,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2025-12-27",
		"hour": 17,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-02",
		"hour": 1,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-02",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-05",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-05",
		"hour": 15,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-05",
		"hour": 0,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-05",
		"hour": 14,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-06",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-06",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-06",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-06",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-06",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-06",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-06",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-07",
		"hour": 21,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-08",
		"hour": 19,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-08",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-08",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-08",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-08",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-08",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-08",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-08",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-08",
		"hour": 17,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-09",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 22,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 6,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 16,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 16,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 13,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-09",
		"hour": 16,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-10",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-10",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-11",
		"hour": 1,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 14,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 11,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 3,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 13,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 13,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 15,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 12,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 13,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 6,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 21,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 4,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 20,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 10,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-11",
		"hour": 19,
		"count": 1,
		"weekday": 0
	},
	{
		"date": "2026-01-12",
		"hour": 22,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 20,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 4,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 5,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 3,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 23,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 6,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 12,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 18,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 17,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-12",
		"hour": 1,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-13",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 15,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 16,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 0,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 1,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 6,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 1,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 21,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-13",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-14",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-14",
		"hour": 16,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-14",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-14",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-14",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-15",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-15",
		"hour": 19,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-15",
		"hour": 10,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-15",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-15",
		"hour": 11,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-15",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-15",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-15",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-16",
		"hour": 20,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-19",
		"hour": 2,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-20",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-20",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-20",
		"hour": 19,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-21",
		"hour": 23,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-21",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-22",
		"hour": 22,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-22",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-22",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-23",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-23",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-26",
		"hour": 12,
		"count": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-27",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 16,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 7,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 3,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 17,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 10,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 6,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 16,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 5,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 22,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 20,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 18,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 4,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 16,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 14,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 10,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-27",
		"hour": 2,
		"count": 1,
		"weekday": 2
	},
	{
		"date": "2026-01-28",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 15,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 2,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 11,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 20,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 5,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 18,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 7,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 17,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 16,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 13,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 4,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 22,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 19,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 14,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-28",
		"hour": 3,
		"count": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-29",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 6,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 4,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 14,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 20,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 2,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 1,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 5,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 3,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 15,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 21,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 16,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-29",
		"hour": 18,
		"count": 1,
		"weekday": 4
	},
	{
		"date": "2026-01-30",
		"hour": 13,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 5,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 15,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 18,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 3,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 11,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 18,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 14,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 2,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 12,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 17,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 4,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 13,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 10,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-30",
		"hour": 21,
		"count": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-31",
		"hour": 5,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 17,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 19,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 17,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 13,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 9,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 18,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 16,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 21,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 14,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 2,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 22,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 4,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 20,
		"count": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-31",
		"hour": 22,
		"count": 1,
		"weekday": 6
	}
];
var rawContributions = [
	{
		"date": "2025-02-06",
		"contributionCount": 1,
		"weekday": 4
	},
	{
		"date": "2025-02-07",
		"contributionCount": 4,
		"weekday": 5
	},
	{
		"date": "2025-02-08",
		"contributionCount": 4,
		"weekday": 6
	},
	{
		"date": "2025-02-11",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-02-13",
		"contributionCount": 3,
		"weekday": 4
	},
	{
		"date": "2025-02-18",
		"contributionCount": 3,
		"weekday": 2
	},
	{
		"date": "2025-02-25",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-02-27",
		"contributionCount": 5,
		"weekday": 4
	},
	{
		"date": "2025-03-03",
		"contributionCount": 2,
		"weekday": 1
	},
	{
		"date": "2025-03-06",
		"contributionCount": 5,
		"weekday": 4
	},
	{
		"date": "2025-03-07",
		"contributionCount": 1,
		"weekday": 5
	},
	{
		"date": "2025-03-10",
		"contributionCount": 6,
		"weekday": 1
	},
	{
		"date": "2025-03-11",
		"contributionCount": 7,
		"weekday": 2
	},
	{
		"date": "2025-03-12",
		"contributionCount": 2,
		"weekday": 3
	},
	{
		"date": "2025-03-13",
		"contributionCount": 4,
		"weekday": 4
	},
	{
		"date": "2025-03-14",
		"contributionCount": 4,
		"weekday": 5
	},
	{
		"date": "2025-03-15",
		"contributionCount": 5,
		"weekday": 6
	},
	{
		"date": "2025-03-18",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-03-20",
		"contributionCount": 3,
		"weekday": 4
	},
	{
		"date": "2025-03-26",
		"contributionCount": 5,
		"weekday": 3
	},
	{
		"date": "2025-03-27",
		"contributionCount": 5,
		"weekday": 4
	},
	{
		"date": "2025-03-29",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2025-03-30",
		"contributionCount": 2,
		"weekday": 0
	},
	{
		"date": "2025-03-31",
		"contributionCount": 2,
		"weekday": 1
	},
	{
		"date": "2025-04-01",
		"contributionCount": 14,
		"weekday": 2
	},
	{
		"date": "2025-04-02",
		"contributionCount": 18,
		"weekday": 3
	},
	{
		"date": "2025-04-03",
		"contributionCount": 12,
		"weekday": 4
	},
	{
		"date": "2025-04-04",
		"contributionCount": 12,
		"weekday": 5
	},
	{
		"date": "2025-04-05",
		"contributionCount": 8,
		"weekday": 6
	},
	{
		"date": "2025-04-06",
		"contributionCount": 4,
		"weekday": 0
	},
	{
		"date": "2025-04-07",
		"contributionCount": 4,
		"weekday": 1
	},
	{
		"date": "2025-04-09",
		"contributionCount": 6,
		"weekday": 3
	},
	{
		"date": "2025-04-17",
		"contributionCount": 1,
		"weekday": 4
	},
	{
		"date": "2025-04-18",
		"contributionCount": 6,
		"weekday": 5
	},
	{
		"date": "2025-04-19",
		"contributionCount": 2,
		"weekday": 6
	},
	{
		"date": "2025-04-20",
		"contributionCount": 10,
		"weekday": 0
	},
	{
		"date": "2025-04-21",
		"contributionCount": 21,
		"weekday": 1
	},
	{
		"date": "2025-04-22",
		"contributionCount": 16,
		"weekday": 2
	},
	{
		"date": "2025-04-23",
		"contributionCount": 13,
		"weekday": 3
	},
	{
		"date": "2025-04-24",
		"contributionCount": 3,
		"weekday": 4
	},
	{
		"date": "2025-04-25",
		"contributionCount": 7,
		"weekday": 5
	},
	{
		"date": "2025-04-26",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2025-04-27",
		"contributionCount": 18,
		"weekday": 0
	},
	{
		"date": "2025-04-28",
		"contributionCount": 21,
		"weekday": 1
	},
	{
		"date": "2025-04-29",
		"contributionCount": 37,
		"weekday": 2
	},
	{
		"date": "2025-04-30",
		"contributionCount": 28,
		"weekday": 3
	},
	{
		"date": "2025-05-01",
		"contributionCount": 6,
		"weekday": 4
	},
	{
		"date": "2025-05-02",
		"contributionCount": 6,
		"weekday": 5
	},
	{
		"date": "2025-05-03",
		"contributionCount": 18,
		"weekday": 6
	},
	{
		"date": "2025-05-04",
		"contributionCount": 32,
		"weekday": 0
	},
	{
		"date": "2025-05-05",
		"contributionCount": 27,
		"weekday": 1
	},
	{
		"date": "2025-05-06",
		"contributionCount": 8,
		"weekday": 2
	},
	{
		"date": "2025-05-07",
		"contributionCount": 19,
		"weekday": 3
	},
	{
		"date": "2025-05-08",
		"contributionCount": 15,
		"weekday": 4
	},
	{
		"date": "2025-05-09",
		"contributionCount": 16,
		"weekday": 5
	},
	{
		"date": "2025-05-10",
		"contributionCount": 3,
		"weekday": 6
	},
	{
		"date": "2025-05-11",
		"contributionCount": 6,
		"weekday": 0
	},
	{
		"date": "2025-05-14",
		"contributionCount": 6,
		"weekday": 3
	},
	{
		"date": "2025-05-15",
		"contributionCount": 5,
		"weekday": 4
	},
	{
		"date": "2025-05-16",
		"contributionCount": 7,
		"weekday": 5
	},
	{
		"date": "2025-05-17",
		"contributionCount": 9,
		"weekday": 6
	},
	{
		"date": "2025-05-18",
		"contributionCount": 10,
		"weekday": 0
	},
	{
		"date": "2025-05-19",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2025-05-20",
		"contributionCount": 8,
		"weekday": 2
	},
	{
		"date": "2025-05-22",
		"contributionCount": 7,
		"weekday": 4
	},
	{
		"date": "2025-05-23",
		"contributionCount": 2,
		"weekday": 5
	},
	{
		"date": "2025-05-24",
		"contributionCount": 6,
		"weekday": 6
	},
	{
		"date": "2025-05-25",
		"contributionCount": 3,
		"weekday": 0
	},
	{
		"date": "2025-05-26",
		"contributionCount": 18,
		"weekday": 1
	},
	{
		"date": "2025-05-27",
		"contributionCount": 7,
		"weekday": 2
	},
	{
		"date": "2025-05-28",
		"contributionCount": 2,
		"weekday": 3
	},
	{
		"date": "2025-05-29",
		"contributionCount": 1,
		"weekday": 4
	},
	{
		"date": "2025-05-30",
		"contributionCount": 5,
		"weekday": 5
	},
	{
		"date": "2025-05-31",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2025-06-02",
		"contributionCount": 5,
		"weekday": 1
	},
	{
		"date": "2025-06-03",
		"contributionCount": 17,
		"weekday": 2
	},
	{
		"date": "2025-06-04",
		"contributionCount": 3,
		"weekday": 3
	},
	{
		"date": "2025-06-05",
		"contributionCount": 3,
		"weekday": 4
	},
	{
		"date": "2025-06-06",
		"contributionCount": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-09",
		"contributionCount": 2,
		"weekday": 1
	},
	{
		"date": "2025-06-10",
		"contributionCount": 5,
		"weekday": 2
	},
	{
		"date": "2025-06-11",
		"contributionCount": 2,
		"weekday": 3
	},
	{
		"date": "2025-06-12",
		"contributionCount": 2,
		"weekday": 4
	},
	{
		"date": "2025-06-13",
		"contributionCount": 1,
		"weekday": 5
	},
	{
		"date": "2025-06-14",
		"contributionCount": 3,
		"weekday": 6
	},
	{
		"date": "2025-06-16",
		"contributionCount": 2,
		"weekday": 1
	},
	{
		"date": "2025-06-18",
		"contributionCount": 8,
		"weekday": 3
	},
	{
		"date": "2025-06-19",
		"contributionCount": 9,
		"weekday": 4
	},
	{
		"date": "2025-06-20",
		"contributionCount": 10,
		"weekday": 5
	},
	{
		"date": "2025-06-21",
		"contributionCount": 5,
		"weekday": 6
	},
	{
		"date": "2025-06-22",
		"contributionCount": 12,
		"weekday": 0
	},
	{
		"date": "2025-06-23",
		"contributionCount": 4,
		"weekday": 1
	},
	{
		"date": "2025-06-24",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-06-25",
		"contributionCount": 3,
		"weekday": 3
	},
	{
		"date": "2025-06-26",
		"contributionCount": 11,
		"weekday": 4
	},
	{
		"date": "2025-06-27",
		"contributionCount": 3,
		"weekday": 5
	},
	{
		"date": "2025-06-29",
		"contributionCount": 2,
		"weekday": 0
	},
	{
		"date": "2025-06-30",
		"contributionCount": 4,
		"weekday": 1
	},
	{
		"date": "2025-07-01",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-05",
		"contributionCount": 2,
		"weekday": 6
	},
	{
		"date": "2025-07-07",
		"contributionCount": 4,
		"weekday": 1
	},
	{
		"date": "2025-07-08",
		"contributionCount": 2,
		"weekday": 2
	},
	{
		"date": "2025-07-11",
		"contributionCount": 2,
		"weekday": 5
	},
	{
		"date": "2025-07-15",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-07-16",
		"contributionCount": 3,
		"weekday": 3
	},
	{
		"date": "2025-07-17",
		"contributionCount": 5,
		"weekday": 4
	},
	{
		"date": "2025-07-18",
		"contributionCount": 3,
		"weekday": 5
	},
	{
		"date": "2025-07-19",
		"contributionCount": 2,
		"weekday": 6
	},
	{
		"date": "2025-07-20",
		"contributionCount": 5,
		"weekday": 0
	},
	{
		"date": "2025-07-21",
		"contributionCount": 15,
		"weekday": 1
	},
	{
		"date": "2025-07-22",
		"contributionCount": 8,
		"weekday": 2
	},
	{
		"date": "2025-07-23",
		"contributionCount": 1,
		"weekday": 3
	},
	{
		"date": "2025-07-26",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2025-07-27",
		"contributionCount": 10,
		"weekday": 0
	},
	{
		"date": "2025-07-28",
		"contributionCount": 10,
		"weekday": 1
	},
	{
		"date": "2025-07-29",
		"contributionCount": 17,
		"weekday": 2
	},
	{
		"date": "2025-07-30",
		"contributionCount": 10,
		"weekday": 3
	},
	{
		"date": "2025-07-31",
		"contributionCount": 6,
		"weekday": 4
	},
	{
		"date": "2025-08-01",
		"contributionCount": 1,
		"weekday": 5
	},
	{
		"date": "2025-08-02",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2025-08-04",
		"contributionCount": 4,
		"weekday": 1
	},
	{
		"date": "2025-08-05",
		"contributionCount": 4,
		"weekday": 2
	},
	{
		"date": "2025-08-11",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2025-08-12",
		"contributionCount": 7,
		"weekday": 2
	},
	{
		"date": "2025-08-13",
		"contributionCount": 1,
		"weekday": 3
	},
	{
		"date": "2025-08-14",
		"contributionCount": 3,
		"weekday": 4
	},
	{
		"date": "2025-08-15",
		"contributionCount": 9,
		"weekday": 5
	},
	{
		"date": "2025-08-18",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2025-08-26",
		"contributionCount": 6,
		"weekday": 2
	},
	{
		"date": "2025-08-27",
		"contributionCount": 2,
		"weekday": 3
	},
	{
		"date": "2025-08-31",
		"contributionCount": 7,
		"weekday": 0
	},
	{
		"date": "2025-09-02",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-09-03",
		"contributionCount": 2,
		"weekday": 3
	},
	{
		"date": "2025-09-04",
		"contributionCount": 2,
		"weekday": 4
	},
	{
		"date": "2025-09-06",
		"contributionCount": 19,
		"weekday": 6
	},
	{
		"date": "2025-09-07",
		"contributionCount": 14,
		"weekday": 0
	},
	{
		"date": "2025-09-08",
		"contributionCount": 9,
		"weekday": 1
	},
	{
		"date": "2025-09-09",
		"contributionCount": 4,
		"weekday": 2
	},
	{
		"date": "2025-09-10",
		"contributionCount": 25,
		"weekday": 3
	},
	{
		"date": "2025-09-11",
		"contributionCount": 2,
		"weekday": 4
	},
	{
		"date": "2025-09-12",
		"contributionCount": 10,
		"weekday": 5
	},
	{
		"date": "2025-09-13",
		"contributionCount": 10,
		"weekday": 6
	},
	{
		"date": "2025-09-14",
		"contributionCount": 7,
		"weekday": 0
	},
	{
		"date": "2025-09-15",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2025-09-16",
		"contributionCount": 2,
		"weekday": 2
	},
	{
		"date": "2025-09-17",
		"contributionCount": 5,
		"weekday": 3
	},
	{
		"date": "2025-09-18",
		"contributionCount": 9,
		"weekday": 4
	},
	{
		"date": "2025-09-19",
		"contributionCount": 2,
		"weekday": 5
	},
	{
		"date": "2025-09-20",
		"contributionCount": 5,
		"weekday": 6
	},
	{
		"date": "2025-09-21",
		"contributionCount": 6,
		"weekday": 0
	},
	{
		"date": "2025-09-22",
		"contributionCount": 6,
		"weekday": 1
	},
	{
		"date": "2025-09-23",
		"contributionCount": 11,
		"weekday": 2
	},
	{
		"date": "2025-09-24",
		"contributionCount": 2,
		"weekday": 3
	},
	{
		"date": "2025-09-25",
		"contributionCount": 6,
		"weekday": 4
	},
	{
		"date": "2025-09-26",
		"contributionCount": 2,
		"weekday": 5
	},
	{
		"date": "2025-09-27",
		"contributionCount": 5,
		"weekday": 6
	},
	{
		"date": "2025-09-29",
		"contributionCount": 5,
		"weekday": 1
	},
	{
		"date": "2025-09-30",
		"contributionCount": 4,
		"weekday": 2
	},
	{
		"date": "2025-10-01",
		"contributionCount": 6,
		"weekday": 3
	},
	{
		"date": "2025-10-02",
		"contributionCount": 18,
		"weekday": 4
	},
	{
		"date": "2025-10-03",
		"contributionCount": 13,
		"weekday": 5
	},
	{
		"date": "2025-10-04",
		"contributionCount": 77,
		"weekday": 6
	},
	{
		"date": "2025-10-05",
		"contributionCount": 16,
		"weekday": 0
	},
	{
		"date": "2025-10-07",
		"contributionCount": 4,
		"weekday": 2
	},
	{
		"date": "2025-10-08",
		"contributionCount": 18,
		"weekday": 3
	},
	{
		"date": "2025-10-09",
		"contributionCount": 27,
		"weekday": 4
	},
	{
		"date": "2025-10-10",
		"contributionCount": 31,
		"weekday": 5
	},
	{
		"date": "2025-10-11",
		"contributionCount": 14,
		"weekday": 6
	},
	{
		"date": "2025-10-12",
		"contributionCount": 4,
		"weekday": 0
	},
	{
		"date": "2025-10-13",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-14",
		"contributionCount": 3,
		"weekday": 2
	},
	{
		"date": "2025-10-15",
		"contributionCount": 2,
		"weekday": 3
	},
	{
		"date": "2025-10-16",
		"contributionCount": 4,
		"weekday": 4
	},
	{
		"date": "2025-10-19",
		"contributionCount": 6,
		"weekday": 0
	},
	{
		"date": "2025-10-20",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2025-10-21",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-10-22",
		"contributionCount": 3,
		"weekday": 3
	},
	{
		"date": "2025-10-24",
		"contributionCount": 2,
		"weekday": 5
	},
	{
		"date": "2025-10-25",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2025-10-27",
		"contributionCount": 6,
		"weekday": 1
	},
	{
		"date": "2025-10-29",
		"contributionCount": 1,
		"weekday": 3
	},
	{
		"date": "2025-10-30",
		"contributionCount": 2,
		"weekday": 4
	},
	{
		"date": "2025-10-31",
		"contributionCount": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-03",
		"contributionCount": 4,
		"weekday": 1
	},
	{
		"date": "2025-11-04",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-10",
		"contributionCount": 7,
		"weekday": 1
	},
	{
		"date": "2025-11-11",
		"contributionCount": 6,
		"weekday": 2
	},
	{
		"date": "2025-11-14",
		"contributionCount": 1,
		"weekday": 5
	},
	{
		"date": "2025-11-15",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2025-11-16",
		"contributionCount": 3,
		"weekday": 0
	},
	{
		"date": "2025-11-18",
		"contributionCount": 1,
		"weekday": 2
	},
	{
		"date": "2025-11-19",
		"contributionCount": 7,
		"weekday": 3
	},
	{
		"date": "2025-11-20",
		"contributionCount": 7,
		"weekday": 4
	},
	{
		"date": "2025-11-21",
		"contributionCount": 8,
		"weekday": 5
	},
	{
		"date": "2025-11-22",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2025-11-24",
		"contributionCount": 3,
		"weekday": 1
	},
	{
		"date": "2025-12-03",
		"contributionCount": 1,
		"weekday": 3
	},
	{
		"date": "2025-12-04",
		"contributionCount": 1,
		"weekday": 4
	},
	{
		"date": "2025-12-05",
		"contributionCount": 1,
		"weekday": 5
	},
	{
		"date": "2025-12-08",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2025-12-10",
		"contributionCount": 1,
		"weekday": 3
	},
	{
		"date": "2025-12-11",
		"contributionCount": 1,
		"weekday": 4
	},
	{
		"date": "2025-12-14",
		"contributionCount": 1,
		"weekday": 0
	},
	{
		"date": "2025-12-17",
		"contributionCount": 4,
		"weekday": 3
	},
	{
		"date": "2025-12-19",
		"contributionCount": 3,
		"weekday": 5
	},
	{
		"date": "2025-12-27",
		"contributionCount": 1,
		"weekday": 6
	},
	{
		"date": "2026-01-02",
		"contributionCount": 2,
		"weekday": 5
	},
	{
		"date": "2026-01-05",
		"contributionCount": 4,
		"weekday": 1
	},
	{
		"date": "2026-01-06",
		"contributionCount": 7,
		"weekday": 2
	},
	{
		"date": "2026-01-07",
		"contributionCount": 1,
		"weekday": 3
	},
	{
		"date": "2026-01-08",
		"contributionCount": 9,
		"weekday": 4
	},
	{
		"date": "2026-01-09",
		"contributionCount": 16,
		"weekday": 5
	},
	{
		"date": "2026-01-10",
		"contributionCount": 2,
		"weekday": 6
	},
	{
		"date": "2026-01-11",
		"contributionCount": 21,
		"weekday": 0
	},
	{
		"date": "2026-01-12",
		"contributionCount": 16,
		"weekday": 1
	},
	{
		"date": "2026-01-13",
		"contributionCount": 14,
		"weekday": 2
	},
	{
		"date": "2026-01-14",
		"contributionCount": 5,
		"weekday": 3
	},
	{
		"date": "2026-01-15",
		"contributionCount": 8,
		"weekday": 4
	},
	{
		"date": "2026-01-16",
		"contributionCount": 1,
		"weekday": 5
	},
	{
		"date": "2026-01-19",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-20",
		"contributionCount": 3,
		"weekday": 2
	},
	{
		"date": "2026-01-21",
		"contributionCount": 2,
		"weekday": 3
	},
	{
		"date": "2026-01-22",
		"contributionCount": 3,
		"weekday": 4
	},
	{
		"date": "2026-01-23",
		"contributionCount": 2,
		"weekday": 5
	},
	{
		"date": "2026-01-26",
		"contributionCount": 1,
		"weekday": 1
	},
	{
		"date": "2026-01-27",
		"contributionCount": 22,
		"weekday": 2
	},
	{
		"date": "2026-01-28",
		"contributionCount": 41,
		"weekday": 3
	},
	{
		"date": "2026-01-29",
		"contributionCount": 20,
		"weekday": 4
	},
	{
		"date": "2026-01-30",
		"contributionCount": 21,
		"weekday": 5
	},
	{
		"date": "2026-01-31",
		"contributionCount": 22,
		"weekday": 6
	}
];
var gitHistory_default = {
	stats,
	commits,
	rawContributions
};

//#endregion
//#region src/hooks/useGitData.ts
function useGitData(username, data, dataUrl) {
	const [gitData, setGitData] = useState(data || null);
	const [loading, setLoading] = useState(!data);
	const [error, setError] = useState(null);
	useEffect(() => {
		if (data) {
			setGitData(data);
			setLoading(false);
			return;
		}
		if (dataUrl) {
			fetchFromUrl(dataUrl);
			return;
		}
		if (username) {
			fetchGitHubContributions(username);
			return;
		}
		loadLocalData();
	}, [
		username,
		data,
		dataUrl
	]);
	async function fetchFromUrl(url) {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
			const fetchedData = await response.json();
			setGitData(fetchedData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch data");
			setGitData(null);
		} finally {
			setLoading(false);
		}
	}
	async function fetchGitHubContributions(user) {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
			if (!response.ok) throw new Error(`Failed to fetch GitHub data: ${response.status}`);
			const apiData = await response.json();
			const rawContributions$1 = apiData.contributions.map((c) => ({
				date: c.date,
				contributionCount: c.count,
				weekday: new Date(c.date).getDay()
			}));
			const totalCommits = Object.values(apiData.total).reduce((a, b) => a + b, 0);
			const dates = rawContributions$1.map((c) => c.date).sort();
			const transformedData = {
				stats: {
					totalCommits,
					totalContributionDays: rawContributions$1.filter((c) => c.contributionCount > 0).length,
					dateRange: {
						from: dates[0] || "",
						to: dates[dates.length - 1] || ""
					},
					hourDistribution: new Array(24).fill(0),
					dayDistribution: new Array(7).fill(0),
					fetchDuration: "0ms",
					fetchTimestamp: new Date().toISOString()
				},
				commits: [],
				rawContributions: rawContributions$1
			};
			setGitData(transformedData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch GitHub data");
			loadLocalData();
		} finally {
			setLoading(false);
		}
	}
	function loadLocalData() {
		try {
			setLoading(true);
			setGitData(gitHistory_default);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			setGitData(null);
		} finally {
			setLoading(false);
		}
	}
	return {
		data: gitData,
		loading,
		error
	};
}

//#endregion
//#region src/utils/colorSchemes.ts
const colorSchemes = {
	aurora: {
		background: "#000000",
		primary: [
			"#00ffcc",
			"#00d4ff",
			"#7b2cbf",
			"#c77dff"
		],
		accent: "#00ffcc"
	},
	cosmic: {
		background: "#000000",
		primary: [
			"#1e3a8a",
			"#3b82f6",
			"#60a5fa",
			"#93c5fd"
		],
		accent: "#60a5fa"
	},
	monochrome: {
		background: "#000000",
		primary: [
			"#404040",
			"#808080",
			"#b0b0b0",
			"#e0e0e0"
		],
		accent: "#ffffff"
	},
	sunset: {
		background: "#000000",
		primary: [
			"#ff6b35",
			"#f7931e",
			"#fdc830",
			"#f37335"
		],
		accent: "#ff6b35"
	},
	matrix: {
		background: "#000000",
		primary: [
			"#003b00",
			"#00ff00",
			"#39ff14",
			"#00ff00"
		],
		accent: "#00ff00"
	},
	nebula: {
		background: "#000000",
		primary: [
			"#2d1b4e",
			"#4a1f7c",
			"#7b2cbf",
			"#9d4edd",
			"#c77dff"
		],
		accent: "#9d4edd"
	},
	ocean: {
		background: "#000000",
		primary: [
			"#005f73",
			"#0a9396",
			"#94d2bd",
			"#40e0d0"
		],
		accent: "#40e0d0"
	},
	ember: {
		background: "#000000",
		primary: [
			"#4a1c10",
			"#8b2500",
			"#cc4400",
			"#ff6633",
			"#ff9966"
		],
		accent: "#ff6633"
	}
};
function getColorScheme(scheme) {
	return colorSchemes[scheme];
}

//#endregion
//#region src/constants.ts
const DEFAULTS = {
	variant: "daily-spiral",
	width: 800,
	height: 600,
	colorScheme: "aurora",
	animated: true,
	speed: 1.5,
	particleCount: 2e3,
	lifetimeSeconds: 20,
	maxRadius: .7,
	initialSpeed: .4,
	acceleration: .5,
	deceleration: .0025,
	spawnRate: 2,
	particleGlow: 0,
	particleScale: 1,
	fadeInDuration: 0,
	interactive: true,
	hoverGlow: false,
	glowRadius: 180,
	glowIntensity: .7,
	mouseRepel: false,
	repelRadius: 100,
	repelStrength: .5,
	mouseAttract: false,
	attractRadius: 100,
	attractStrength: .3,
	luminanceBoost: false,
	luminanceRadius: 120,
	luminanceAmount: .5,
	sizeOnHover: false,
	sizeRadius: 100,
	sizeMultiplier: 2,
	spiralTurnRate: 1.2,
	spiralExpansion: .34,
	spiralClockwise: true,
	spiralCenterOffset: 0,
	bloomVelocity: .5,
	bloomSpread: 50,
	ringsWobble: 1,
	ringsArcLength: .8,
	ringsClockwise: true,
	showAllDays: false
};
const INITIAL_PARAMS = {
	variant: DEFAULTS.variant,
	selectedPreset: DEFAULTS.colorScheme,
	customBackground: "#000000",
	customColorsInput: "#00ffcc, #00d4ff, #7b2cbf, #c77dff",
	width: 0,
	height: 0,
	fadeInDuration: DEFAULTS.fadeInDuration,
	speed: DEFAULTS.speed,
	lifetimeSeconds: DEFAULTS.lifetimeSeconds,
	maxRadius: DEFAULTS.maxRadius,
	initialSpeed: DEFAULTS.initialSpeed,
	acceleration: DEFAULTS.acceleration,
	deceleration: DEFAULTS.deceleration,
	spawnRate: DEFAULTS.spawnRate,
	particleGlow: DEFAULTS.particleGlow,
	particleScale: DEFAULTS.particleScale,
	hoverGlow: DEFAULTS.hoverGlow,
	glowRadius: DEFAULTS.glowRadius,
	glowIntensity: DEFAULTS.glowIntensity,
	mouseRepel: DEFAULTS.mouseRepel,
	repelRadius: DEFAULTS.repelRadius,
	repelStrength: DEFAULTS.repelStrength,
	mouseAttract: DEFAULTS.mouseAttract,
	attractRadius: DEFAULTS.attractRadius,
	attractStrength: DEFAULTS.attractStrength,
	luminanceBoost: DEFAULTS.luminanceBoost,
	luminanceRadius: DEFAULTS.luminanceRadius,
	luminanceAmount: DEFAULTS.luminanceAmount,
	sizeOnHover: DEFAULTS.sizeOnHover,
	sizeRadius: DEFAULTS.sizeRadius,
	sizeMultiplier: DEFAULTS.sizeMultiplier,
	spiralTurnRate: DEFAULTS.spiralTurnRate,
	spiralExpansion: DEFAULTS.spiralExpansion,
	spiralClockwise: DEFAULTS.spiralClockwise,
	spiralCenterOffset: DEFAULTS.spiralCenterOffset,
	bloomVelocity: DEFAULTS.bloomVelocity,
	bloomSpread: DEFAULTS.bloomSpread,
	ringsWobble: DEFAULTS.ringsWobble,
	ringsArcLength: DEFAULTS.ringsArcLength,
	ringsClockwise: DEFAULTS.ringsClockwise,
	showAllDays: DEFAULTS.showAllDays
};

//#endregion
//#region src/utils/seededRandom.ts
/**
* Mulberry32 - a simple, fast 32-bit seeded PRNG
* Returns a function that generates deterministic random numbers [0, 1)
*/
function createSeededRandom(seed) {
	return function() {
		let t = seed += 1831565813;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
/**
* Generate a numeric seed from a string (e.g., date string)
*/
function hashString(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}
/**
* Create a seeded random generator for a specific particle
* Combines date, spawn index, and particle index for unique but reproducible seeds
*/
function createParticleRandom(date, spawnIndex, particleIndex) {
	const baseSeed = hashString(date);
	const combinedSeed = baseSeed + spawnIndex * 1000003 + particleIndex * 7919;
	return createSeededRandom(combinedSeed);
}

//#endregion
//#region src/components/variants/DailyBloom.tsx
const DailyBloom = memo(function DailyBloom$1({ data, width, height, palette, speed, spawnRate, lifetimeSeconds, maxRadius, initialSpeed, acceleration, deceleration, mouseEffects, clearTrigger, resetTrigger, onDayChange, bloomVelocity, bloomSpread, paused, particleGlow, particleScale, fadeInDuration, showAllDays, mouseX, mouseY, mouseTransform }) {
	const canvasRef = useRef(null);
	const bloomsRef = useRef([]);
	const timeRef = useRef(0);
	const spawnIndexRef = useRef(0);
	const frameCountRef = useRef(0);
	const mouseRef = useRef({
		x: -1e3,
		y: -1e3
	});
	const centerX = width / 2;
	const centerY = height / 2;
	const maxDistance = Math.min(width, height) * maxRadius;
	useEffect(() => {
		bloomsRef.current = [];
	}, [clearTrigger]);
	useEffect(() => {
		bloomsRef.current = [];
		spawnIndexRef.current = 0;
	}, [resetTrigger]);
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const usingExternalMouse = mouseX !== void 0 && mouseY !== void 0;
		const handleMouseMove = (e) => {
			if (usingExternalMouse) return;
			const rect = canvas.getBoundingClientRect();
			let x = e.clientX - rect.left;
			let y = e.clientY - rect.top;
			if (mouseTransform) {
				const transformed = mouseTransform(x, y);
				x = transformed.x;
				y = transformed.y;
			}
			mouseRef.current = {
				x,
				y
			};
		};
		const handleMouseLeave = () => {
			if (usingExternalMouse) return;
			mouseRef.current = {
				x: -1e3,
				y: -1e3
			};
		};
		if (!usingExternalMouse) {
			canvas.addEventListener("mousemove", handleMouseMove);
			canvas.addEventListener("mouseleave", handleMouseLeave);
		}
		let animationId;
		const dailyContributions = data.rawContributions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		function spawnBloomsForDay() {
			if (showAllDays) {
				if (spawnIndexRef.current >= dailyContributions.length) spawnIndexRef.current = 0;
				const day = dailyContributions[spawnIndexRef.current];
				const commitCount = day.contributionCount;
				onDayChange?.({
					day: spawnIndexRef.current + 1,
					total: dailyContributions.length,
					date: day.date
				});
				if (commitCount > 0) {
					const bloomCount = Math.min(Math.ceil(commitCount / 3), 5);
					for (let i = 0; i < bloomCount; i++) {
						const random = createParticleRandom(day.date, spawnIndexRef.current, i);
						const angle = random() * Math.PI * 2;
						const distance = random() * bloomSpread;
						const colorSeed = (commitCount * 7 + spawnIndexRef.current * 13 + i * 3) % palette.primary.length;
						const color = palette.primary[colorSeed];
						const baseVelocity = bloomVelocity;
						const sizeFromCommits = (2 + Math.min(commitCount, 30) * .2) * particleScale;
						bloomsRef.current.push({
							x: centerX + Math.cos(angle) * distance,
							y: centerY + Math.sin(angle) * distance,
							vx: Math.cos(angle) * baseVelocity,
							vy: Math.sin(angle) * baseVelocity,
							baseRadius: sizeFromCommits,
							color,
							age: 0,
							maxAge: lifetimeSeconds * 60,
							glowActivation: 0
						});
					}
				}
				spawnIndexRef.current++;
			} else {
				let attempts = 0;
				while (attempts < dailyContributions.length) {
					if (spawnIndexRef.current >= dailyContributions.length) spawnIndexRef.current = 0;
					const day = dailyContributions[spawnIndexRef.current];
					const commitCount = day.contributionCount;
					onDayChange?.({
						day: spawnIndexRef.current + 1,
						total: dailyContributions.length,
						date: day.date
					});
					spawnIndexRef.current++;
					if (commitCount > 0) {
						const bloomCount = Math.min(Math.ceil(commitCount / 3), 5);
						for (let i = 0; i < bloomCount; i++) {
							const random = createParticleRandom(day.date, spawnIndexRef.current, i);
							const angle = random() * Math.PI * 2;
							const distance = random() * bloomSpread;
							const colorSeed = (commitCount * 7 + spawnIndexRef.current * 13 + i * 3) % palette.primary.length;
							const color = palette.primary[colorSeed];
							const baseVelocity = bloomVelocity;
							const sizeFromCommits = (2 + Math.min(commitCount, 30) * .2) * particleScale;
							bloomsRef.current.push({
								x: centerX + Math.cos(angle) * distance,
								y: centerY + Math.sin(angle) * distance,
								vx: Math.cos(angle) * baseVelocity,
								vy: Math.sin(angle) * baseVelocity,
								baseRadius: sizeFromCommits,
								color,
								age: 0,
								maxAge: lifetimeSeconds * 60,
								glowActivation: 0
							});
						}
						return;
					}
					attempts++;
				}
			}
		}
		function animate() {
			if (!ctx || !canvas) return;
			if (!paused) {
				timeRef.current += .01 * speed;
				frameCountRef.current++;
			}
			ctx.clearRect(0, 0, width, height);
			if (!paused) {
				const spawnInterval = Math.max(1, Math.floor(30 / spawnRate));
				if (frameCountRef.current % spawnInterval === 0) spawnBloomsForDay();
			}
			const blooms = bloomsRef.current;
			const mouse = mouseX !== void 0 && mouseY !== void 0 ? {
				x: mouseX,
				y: mouseY
			} : mouseRef.current;
			for (let i = blooms.length - 1; i >= 0; i--) {
				const bloom = blooms[i];
				const accelProgress = acceleration === 0 ? 0 : 1 - Math.pow(1 - acceleration, bloom.age / 30);
				const currentSpeedMultiplier = initialSpeed + (1 - initialSpeed) * accelProgress;
				const dxMouse = bloom.x - mouse.x;
				const dyMouse = bloom.y - mouse.y;
				const distToMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
				if (!paused) {
					bloom.age += 1;
					if (mouseEffects.mouseRepel && distToMouse < mouseEffects.repelRadius && distToMouse > 0) {
						const repelForce = (1 - distToMouse / mouseEffects.repelRadius) * mouseEffects.repelStrength * .1;
						bloom.vx += dxMouse / distToMouse * repelForce;
						bloom.vy += dyMouse / distToMouse * repelForce;
					}
					if (mouseEffects.mouseAttract && distToMouse < mouseEffects.attractRadius && distToMouse > 0) {
						const attractForce = (1 - distToMouse / mouseEffects.attractRadius) * mouseEffects.attractStrength * .25;
						bloom.vx -= dxMouse / distToMouse * attractForce;
						bloom.vy -= dyMouse / distToMouse * attractForce;
					}
					bloom.x += bloom.vx * currentSpeedMultiplier;
					bloom.y += bloom.vy * currentSpeedMultiplier;
					const dampingFactor = 1 - deceleration;
					bloom.vx *= dampingFactor;
					bloom.vy *= dampingFactor;
				}
				const dx = bloom.x - centerX;
				const dy = bloom.y - centerY;
				const distFromCenter = Math.sqrt(dx * dx + dy * dy);
				const ageFade = 1 - bloom.age / bloom.maxAge;
				if (!paused && (bloom.age > bloom.maxAge || distFromCenter > maxDistance)) {
					blooms.splice(i, 1);
					continue;
				}
				let renderRadius = bloom.baseRadius;
				if (mouseEffects.sizeOnHover && distToMouse < mouseEffects.sizeRadius) {
					const sizeFactor = 1 - distToMouse / mouseEffects.sizeRadius;
					renderRadius = bloom.baseRadius * (1 + (mouseEffects.sizeMultiplier - 1) * sizeFactor);
				}
				let luminanceMultiplier = 1;
				if (mouseEffects.luminanceBoost && distToMouse < mouseEffects.luminanceRadius) {
					const lumFactor = 1 - distToMouse / mouseEffects.luminanceRadius;
					luminanceMultiplier = 1 + mouseEffects.luminanceAmount * lumFactor;
				}
				const timeSeconds = bloom.age / 60;
				const fadeIn = fadeInDuration > 0 ? Math.min(1, timeSeconds / fadeInDuration) : 1;
				let alpha = ageFade * fadeIn * Math.min(luminanceMultiplier, 1);
				if (mouseEffects.hoverGlow) {
					const inGlowRadius = distToMouse < mouseEffects.glowRadius;
					if (inGlowRadius && !paused) bloom.glowActivation = Math.min(1, bloom.glowActivation + .035);
					else if (!paused) bloom.glowActivation = Math.max(0, bloom.glowActivation - .015);
				}
				if (mouseEffects.hoverGlow && bloom.glowActivation > 0) {
					const distanceFactor = Math.max(0, 1 - distToMouse / mouseEffects.glowRadius);
					const glowFactor = distanceFactor * distanceFactor;
					const easedActivation = 1 - Math.pow(1 - bloom.glowActivation, 3);
					const glowAlpha = glowFactor * easedActivation * mouseEffects.glowIntensity * ageFade;
					ctx.beginPath();
					ctx.arc(bloom.x, bloom.y, renderRadius * 4, 0, Math.PI * 2);
					ctx.fillStyle = bloom.color + Math.floor(glowAlpha * .2 * 255).toString(16).padStart(2, "0");
					ctx.fill();
					ctx.beginPath();
					ctx.arc(bloom.x, bloom.y, renderRadius * 2.5, 0, Math.PI * 2);
					ctx.fillStyle = bloom.color + Math.floor(glowAlpha * .4 * 255).toString(16).padStart(2, "0");
					ctx.fill();
					ctx.beginPath();
					ctx.arc(bloom.x, bloom.y, renderRadius * 1.5, 0, Math.PI * 2);
					ctx.fillStyle = bloom.color + Math.floor(glowAlpha * .6 * 255).toString(16).padStart(2, "0");
					ctx.fill();
				}
				if (particleGlow > 0) {
					const glowAlpha = alpha * particleGlow * .4;
					ctx.beginPath();
					ctx.arc(bloom.x, bloom.y, renderRadius * 3, 0, Math.PI * 2);
					ctx.fillStyle = bloom.color + Math.floor(glowAlpha * .3 * 255).toString(16).padStart(2, "0");
					ctx.fill();
					ctx.beginPath();
					ctx.arc(bloom.x, bloom.y, renderRadius * 1.8, 0, Math.PI * 2);
					ctx.fillStyle = bloom.color + Math.floor(glowAlpha * .6 * 255).toString(16).padStart(2, "0");
					ctx.fill();
				}
				ctx.fillStyle = bloom.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
				ctx.beginPath();
				ctx.arc(bloom.x, bloom.y, renderRadius, 0, Math.PI * 2);
				ctx.fill();
				if (mouseEffects.luminanceBoost && distToMouse < mouseEffects.luminanceRadius) {
					const lumFactor = 1 - distToMouse / mouseEffects.luminanceRadius;
					const coreAlpha = lumFactor * mouseEffects.luminanceAmount * ageFade * .5;
					ctx.beginPath();
					ctx.arc(bloom.x, bloom.y, renderRadius * .5, 0, Math.PI * 2);
					ctx.fillStyle = "#ffffff" + Math.floor(coreAlpha * 255).toString(16).padStart(2, "0");
					ctx.fill();
				}
			}
			animationId = requestAnimationFrame(animate);
		}
		animate();
		return () => {
			if (animationId) cancelAnimationFrame(animationId);
			if (!usingExternalMouse) {
				canvas.removeEventListener("mousemove", handleMouseMove);
				canvas.removeEventListener("mouseleave", handleMouseLeave);
			}
		};
	}, [
		data,
		width,
		height,
		palette,
		speed,
		spawnRate,
		lifetimeSeconds,
		maxRadius,
		initialSpeed,
		acceleration,
		deceleration,
		mouseEffects,
		bloomVelocity,
		bloomSpread,
		paused,
		particleGlow,
		particleScale,
		showAllDays,
		mouseX,
		mouseY,
		mouseTransform
	]);
	return /* @__PURE__ */ jsx(
		"canvas",
		// 0-1, how activated the glow effect is (for smooth transitions)
		// Quadratic falloff
		{
			ref: canvasRef,
			width,
			height,
			style: { background: "transparent" }
		}
);
});

//#endregion
//#region src/components/variants/DailyRings.tsx
const DailyRings = memo(function DailyRings$1({ data, width, height, palette, speed, spawnRate, lifetimeSeconds, maxRadius, initialSpeed, acceleration, deceleration: _deceleration, mouseEffects, clearTrigger, resetTrigger, onDayChange, ringsWobble, ringsArcLength, ringsClockwise, paused, particleGlow, fadeInDuration, showAllDays, mouseX, mouseY, mouseTransform }) {
	const canvasRef = useRef(null);
	const arcsRef = useRef([]);
	const spawnIndexRef = useRef(0);
	const frameRef = useRef(0);
	const mouseRef = useRef({
		x: -1e3,
		y: -1e3
	});
	const centerX = width / 2;
	const centerY = height / 2;
	const maxDistance = Math.min(width, height) * maxRadius * .5;
	const minOrbitRadius = 20;
	useEffect(() => {
		arcsRef.current = [];
	}, [clearTrigger]);
	useEffect(() => {
		arcsRef.current = [];
		spawnIndexRef.current = 0;
	}, [resetTrigger]);
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const usingExternalMouse = mouseX !== void 0 && mouseY !== void 0;
		const handleMouseMove = (e) => {
			if (usingExternalMouse) return;
			const rect = canvas.getBoundingClientRect();
			let x = e.clientX - rect.left;
			let y = e.clientY - rect.top;
			if (mouseTransform) {
				const transformed = mouseTransform(x, y);
				x = transformed.x;
				y = transformed.y;
			}
			mouseRef.current = {
				x,
				y
			};
		};
		const handleMouseLeave = () => {
			if (usingExternalMouse) return;
			mouseRef.current = {
				x: -1e3,
				y: -1e3
			};
		};
		if (!usingExternalMouse) {
			canvas.addEventListener("mousemove", handleMouseMove);
			canvas.addEventListener("mouseleave", handleMouseLeave);
		}
		let animationId;
		const dailyContributions = data.rawContributions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		const effectiveSpeed = speed * 1;
		function spawnArcsForDay() {
			if (showAllDays) {
				if (spawnIndexRef.current >= dailyContributions.length) spawnIndexRef.current = 0;
				const day = dailyContributions[spawnIndexRef.current];
				const commitCount = day.contributionCount;
				onDayChange?.({
					day: spawnIndexRef.current + 1,
					total: dailyContributions.length,
					date: day.date
				});
				if (commitCount > 0) {
					const baseIntensity = Math.min(commitCount / 15, 1);
					const arcCount = Math.ceil(baseIntensity * 3) + 1;
					for (let i = 0; i < arcCount; i++) {
						const random = createParticleRandom(day.date, spawnIndexRef.current, i);
						const intensity = baseIntensity;
						const colorSeed = (commitCount * 7 + spawnIndexRef.current * 13 + i * 3) % palette.primary.length;
						const color = palette.primary[colorSeed];
						const dateVariation = (random() - .5) * .2;
						const baseRadius = minOrbitRadius + (intensity + dateVariation) * (maxDistance - minOrbitRadius);
						const orbitRadius = Math.max(minOrbitRadius, Math.min(maxDistance, baseRadius));
						const baseVelocity = .002 + random() * .008;
						const angularVelocity = ringsClockwise ? -baseVelocity : baseVelocity;
						const baseArcLength = Math.PI * .1;
						const maxArcLength = Math.PI * ringsArcLength;
						const arcLength = baseArcLength + intensity * (maxArcLength - baseArcLength) + random() * .2;
						const lineWidth = 1 + Math.min(commitCount, 20) * .25;
						const wobbleAmplitude = (2 + intensity * 8) * ringsWobble;
						const wobbleFrequency = .02 + random() * .03;
						const wobblePhase = random() * Math.PI * 2;
						const glowIntensity = .3 + intensity * .7;
						const glowPhase = random() * Math.PI * 2;
						arcsRef.current.push({
							orbitRadius,
							angle: random() * Math.PI * 2,
							angularVelocity,
							arcLength,
							lineWidth,
							wobblePhase,
							wobbleAmplitude,
							wobbleFrequency,
							color,
							glowIntensity,
							glowPhase,
							hoverGlowActivation: 0,
							age: 0,
							maxAge: lifetimeSeconds * 60,
							intensity
						});
					}
				}
				spawnIndexRef.current++;
			} else {
				let attempts = 0;
				while (attempts < dailyContributions.length) {
					if (spawnIndexRef.current >= dailyContributions.length) spawnIndexRef.current = 0;
					const day = dailyContributions[spawnIndexRef.current];
					const commitCount = day.contributionCount;
					onDayChange?.({
						day: spawnIndexRef.current + 1,
						total: dailyContributions.length,
						date: day.date
					});
					spawnIndexRef.current++;
					if (commitCount > 0) {
						const baseIntensity = Math.min(commitCount / 15, 1);
						const arcCount = Math.ceil(baseIntensity * 3) + 1;
						for (let i = 0; i < arcCount; i++) {
							const random = createParticleRandom(day.date, spawnIndexRef.current, i);
							const intensity = baseIntensity;
							const colorSeed = (commitCount * 7 + spawnIndexRef.current * 13 + i * 3) % palette.primary.length;
							const color = palette.primary[colorSeed];
							const dateVariation = (random() - .5) * .2;
							const baseRadius = minOrbitRadius + (intensity + dateVariation) * (maxDistance - minOrbitRadius);
							const orbitRadius = Math.max(minOrbitRadius, Math.min(maxDistance, baseRadius));
							const baseVelocity = .002 + random() * .008;
							const angularVelocity = ringsClockwise ? -baseVelocity : baseVelocity;
							const baseArcLength = Math.PI * .1;
							const maxArcLength = Math.PI * ringsArcLength;
							const arcLength = baseArcLength + intensity * (maxArcLength - baseArcLength) + random() * .2;
							const lineWidth = 1 + Math.min(commitCount, 20) * .25;
							const wobbleAmplitude = (2 + intensity * 8) * ringsWobble;
							const wobbleFrequency = .02 + random() * .03;
							const wobblePhase = random() * Math.PI * 2;
							const glowIntensity = .3 + intensity * .7;
							const glowPhase = random() * Math.PI * 2;
							arcsRef.current.push({
								orbitRadius,
								angle: random() * Math.PI * 2,
								angularVelocity,
								arcLength,
								lineWidth,
								wobblePhase,
								wobbleAmplitude,
								wobbleFrequency,
								color,
								glowIntensity,
								glowPhase,
								hoverGlowActivation: 0,
								age: 0,
								maxAge: lifetimeSeconds * 60,
								intensity
							});
						}
						return;
					}
					attempts++;
				}
			}
		}
		function drawArc(ctx$1, arc, opacity, distToMouse, renderLineWidth, luminanceMultiplier) {
			const wobbleOffset = Math.sin(frameRef.current * arc.wobbleFrequency * effectiveSpeed + arc.wobblePhase) * arc.wobbleAmplitude * .2;
			const currentRadius = arc.orbitRadius + wobbleOffset;
			const boundedRadius = Math.max(minOrbitRadius, Math.min(maxDistance, currentRadius));
			const glowPulse = .5 + .5 * Math.sin(frameRef.current * .03 + arc.glowPhase);
			const currentGlow = arc.glowIntensity * glowPulse;
			if (mouseEffects.hoverGlow && arc.hoverGlowActivation > 0) {
				const distanceFactor = Math.max(0, 1 - distToMouse / mouseEffects.glowRadius);
				const glowFactor = distanceFactor * distanceFactor;
				const easedActivation = 1 - Math.pow(1 - arc.hoverGlowActivation, 3);
				const mouseGlowAlpha = glowFactor * easedActivation * mouseEffects.glowIntensity * opacity;
				ctx$1.beginPath();
				ctx$1.arc(centerX, centerY, boundedRadius, arc.angle, arc.angle + arc.arcLength);
				ctx$1.strokeStyle = arc.color + Math.floor(mouseGlowAlpha * .15 * 255).toString(16).padStart(2, "0");
				ctx$1.lineWidth = renderLineWidth + 18;
				ctx$1.lineCap = "round";
				ctx$1.stroke();
				ctx$1.beginPath();
				ctx$1.arc(centerX, centerY, boundedRadius, arc.angle, arc.angle + arc.arcLength);
				ctx$1.strokeStyle = arc.color + Math.floor(mouseGlowAlpha * .3 * 255).toString(16).padStart(2, "0");
				ctx$1.lineWidth = renderLineWidth + 10;
				ctx$1.lineCap = "round";
				ctx$1.stroke();
				ctx$1.beginPath();
				ctx$1.arc(centerX, centerY, boundedRadius, arc.angle, arc.angle + arc.arcLength);
				ctx$1.strokeStyle = arc.color + Math.floor(mouseGlowAlpha * .5 * 255).toString(16).padStart(2, "0");
				ctx$1.lineWidth = renderLineWidth + 5;
				ctx$1.lineCap = "round";
				ctx$1.stroke();
			}
			if (currentGlow > .1) {
				ctx$1.beginPath();
				ctx$1.arc(centerX, centerY, boundedRadius, arc.angle, arc.angle + arc.arcLength);
				ctx$1.strokeStyle = arc.color + Math.floor(opacity * currentGlow * .4 * 255).toString(16).padStart(2, "0");
				ctx$1.lineWidth = renderLineWidth + 6;
				ctx$1.lineCap = "round";
				ctx$1.stroke();
			}
			const finalOpacity = Math.min(opacity * luminanceMultiplier, 1);
			if (particleGlow > 0) {
				const glowAlpha = opacity * particleGlow * .4;
				ctx$1.beginPath();
				ctx$1.arc(centerX, centerY, boundedRadius, arc.angle, arc.angle + arc.arcLength);
				ctx$1.strokeStyle = arc.color + Math.floor(glowAlpha * .3 * 255).toString(16).padStart(2, "0");
				ctx$1.lineWidth = renderLineWidth + 10;
				ctx$1.lineCap = "round";
				ctx$1.stroke();
				ctx$1.beginPath();
				ctx$1.arc(centerX, centerY, boundedRadius, arc.angle, arc.angle + arc.arcLength);
				ctx$1.strokeStyle = arc.color + Math.floor(glowAlpha * .6 * 255).toString(16).padStart(2, "0");
				ctx$1.lineWidth = renderLineWidth + 5;
				ctx$1.lineCap = "round";
				ctx$1.stroke();
			}
			ctx$1.beginPath();
			ctx$1.arc(centerX, centerY, boundedRadius, arc.angle, arc.angle + arc.arcLength);
			ctx$1.strokeStyle = arc.color + Math.floor(finalOpacity * 255).toString(16).padStart(2, "0");
			ctx$1.lineWidth = renderLineWidth;
			ctx$1.lineCap = "round";
			ctx$1.stroke();
			ctx$1.beginPath();
			ctx$1.arc(centerX, centerY, boundedRadius, arc.angle + arc.arcLength * .1, arc.angle + arc.arcLength * .9);
			ctx$1.strokeStyle = "#ffffff" + Math.floor(finalOpacity * .3 * 255).toString(16).padStart(2, "0");
			ctx$1.lineWidth = Math.max(1, renderLineWidth * .3);
			ctx$1.lineCap = "round";
			ctx$1.stroke();
			if (mouseEffects.luminanceBoost && distToMouse < mouseEffects.luminanceRadius) {
				const lumFactor = 1 - distToMouse / mouseEffects.luminanceRadius;
				const coreAlpha = lumFactor * mouseEffects.luminanceAmount * opacity * .5;
				ctx$1.beginPath();
				ctx$1.arc(centerX, centerY, boundedRadius, arc.angle + arc.arcLength * .2, arc.angle + arc.arcLength * .8);
				ctx$1.strokeStyle = "#ffffff" + Math.floor(coreAlpha * 255).toString(16).padStart(2, "0");
				ctx$1.lineWidth = Math.max(1, renderLineWidth * .5);
				ctx$1.lineCap = "round";
				ctx$1.stroke();
			}
		}
		function drawStaticRings(ctx$1) {
			const ringCount = 5;
			ctx$1.setLineDash([2, 8]);
			for (let i = 1; i <= ringCount; i++) {
				const radius = minOrbitRadius + i / ringCount * (maxDistance - minOrbitRadius);
				ctx$1.beginPath();
				ctx$1.arc(centerX, centerY, radius, 0, Math.PI * 2);
				ctx$1.strokeStyle = palette.primary[0] + "15";
				ctx$1.lineWidth = 1;
				ctx$1.stroke();
			}
			ctx$1.setLineDash([]);
		}
		function animate() {
			if (!ctx || !canvas) return;
			if (!paused) frameRef.current++;
			ctx.clearRect(0, 0, width, height);
			drawStaticRings(ctx);
			if (!paused) {
				const spawnInterval = Math.max(1, Math.floor(30 / spawnRate));
				if (frameRef.current % spawnInterval === 0) spawnArcsForDay();
			}
			const arcs = arcsRef.current;
			const mouse = mouseX !== void 0 && mouseY !== void 0 ? {
				x: mouseX,
				y: mouseY
			} : mouseRef.current;
			for (let i = arcs.length - 1; i >= 0; i--) {
				const arc = arcs[i];
				const wobbleOffset = Math.sin(frameRef.current * arc.wobbleFrequency * effectiveSpeed + arc.wobblePhase) * arc.wobbleAmplitude * .2;
				const currentRadius = arc.orbitRadius + wobbleOffset;
				const arcMidAngle = arc.angle + arc.arcLength / 2;
				const arcMidX = centerX + Math.cos(arcMidAngle) * currentRadius;
				const arcMidY = centerY + Math.sin(arcMidAngle) * currentRadius;
				const dxMouse = arcMidX - mouse.x;
				const dyMouse = arcMidY - mouse.y;
				const distToMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
				const accelProgress = acceleration === 0 ? 0 : 1 - Math.pow(1 - acceleration, arc.age / 30);
				const speedMultiplier = initialSpeed + (1 - initialSpeed) * accelProgress;
				if (!paused) {
					arc.age += effectiveSpeed;
					let angularAcceleration = 0;
					if (mouseEffects.mouseRepel && distToMouse < mouseEffects.repelRadius && distToMouse > 0) {
						const repelForce = (1 - distToMouse / mouseEffects.repelRadius) * mouseEffects.repelStrength * .001;
						const mouseAngle = Math.atan2(mouse.y - centerY, mouse.x - centerX);
						const angleDiff = arcMidAngle - mouseAngle;
						const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
						angularAcceleration += Math.sign(normalizedDiff) * repelForce;
					}
					if (mouseEffects.mouseAttract && distToMouse < mouseEffects.attractRadius && distToMouse > 0) {
						const attractForce = (1 - distToMouse / mouseEffects.attractRadius) * mouseEffects.attractStrength * .005;
						const mouseAngle = Math.atan2(mouse.y - centerY, mouse.x - centerX);
						const angleDiff = mouseAngle - arcMidAngle;
						const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
						angularAcceleration += Math.sign(normalizedDiff) * attractForce;
					}
					arc.angle += (arc.angularVelocity + angularAcceleration) * effectiveSpeed * speedMultiplier;
					if (arc.angle > Math.PI * 2) arc.angle -= Math.PI * 2;
					if (arc.angle < 0) arc.angle += Math.PI * 2;
				}
				let opacity = 1;
				const fadeInEnd = fadeInDuration > 0 ? fadeInDuration * 60 : arc.maxAge * .1;
				const fadeOutStart = arc.maxAge * .7;
				if (arc.age < fadeInEnd) opacity = arc.age / fadeInEnd;
				else if (arc.age > fadeOutStart) opacity = 1 - (arc.age - fadeOutStart) / (arc.maxAge - fadeOutStart);
				if (!paused && arc.age > arc.maxAge) {
					arcs.splice(i, 1);
					continue;
				}
				let renderLineWidth = arc.lineWidth;
				if (mouseEffects.sizeOnHover && distToMouse < mouseEffects.sizeRadius) {
					const sizeFactor = 1 - distToMouse / mouseEffects.sizeRadius;
					renderLineWidth = arc.lineWidth * (1 + (mouseEffects.sizeMultiplier - 1) * sizeFactor);
				}
				let luminanceMultiplier = 1;
				if (mouseEffects.luminanceBoost && distToMouse < mouseEffects.luminanceRadius) {
					const lumFactor = 1 - distToMouse / mouseEffects.luminanceRadius;
					luminanceMultiplier = 1 + mouseEffects.luminanceAmount * lumFactor;
				}
				if (mouseEffects.hoverGlow && !paused) {
					const inGlowRadius = distToMouse < mouseEffects.glowRadius;
					if (inGlowRadius) arc.hoverGlowActivation = Math.min(1, arc.hoverGlowActivation + .035);
					else arc.hoverGlowActivation = Math.max(0, arc.hoverGlowActivation - .015);
				}
				drawArc(ctx, arc, opacity, distToMouse, renderLineWidth, luminanceMultiplier);
			}
			animationId = requestAnimationFrame(animate);
		}
		animate();
		return () => {
			if (animationId) cancelAnimationFrame(animationId);
			if (!usingExternalMouse) {
				canvas.removeEventListener("mousemove", handleMouseMove);
				canvas.removeEventListener("mouseleave", handleMouseLeave);
			}
		};
	}, [
		data,
		width,
		height,
		palette,
		speed,
		lifetimeSeconds,
		maxRadius,
		initialSpeed,
		acceleration,
		mouseEffects,
		ringsWobble,
		ringsArcLength,
		ringsClockwise,
		paused,
		particleGlow,
		showAllDays,
		mouseX,
		mouseY,
		mouseTransform
	]);
	return /* @__PURE__ */ jsx(
		"canvas",
		// Fixed radius from center
		// Current rotation angle
		// Rotation speed (can be negative for reverse)
		// Length of arc in radians
		// Thickness of the arc
		// Phase offset for sine wobble
		// How much the arc wobbles in/out
		// Speed of wobble oscillation
		// For pulsing glow effect
		// Phase for glow pulsing
		// 0-1, how activated the hover glow effect is (for smooth transitions)
		// Original contribution intensity for reference
		// Minimum arc
		// Maximum arc controlled by prop
		// Seeded starting angle
		// Minimum arc
		// Maximum arc controlled by prop
		// Seeded starting angle
		// Quadratic falloff
		// Very faint
		{
			ref: canvasRef,
			width,
			height,
			style: { background: "transparent" }
		}
);
});

//#endregion
//#region src/components/variants/DailySpiral.tsx
const DailySpiral = memo(forwardRef(function DailySpiral$1({ data, width, height, palette, speed, spawnRate, lifetimeSeconds, maxRadius, initialSpeed, acceleration, deceleration, mouseEffects, clearTrigger, resetTrigger, onDayChange, spiralTurnRate, spiralExpansion, spiralClockwise, spiralCenterOffset, paused, particleGlow, particleScale, fadeInDuration, showAllDays, mouseX, mouseY, mouseTransform }, ref) {
	const canvasRef = useRef(null);
	const particlesRef = useRef([]);
	const spawnIndexRef = useRef(0);
	const spiralAngleRef = useRef(0);
	const frameCountRef = useRef(0);
	const mouseRef = useRef({
		x: -1e3,
		y: -1e3
	});
	const colorsRef = useRef(palette.primary);
	const sizeRef = useRef({
		width,
		height
	});
	useImperativeHandle(ref, () => ({ setColors: (colors) => {
		colorsRef.current = colors;
	} }));
	useEffect(() => {
		colorsRef.current = palette.primary;
	}, [palette.primary]);
	useEffect(() => {
		sizeRef.current = {
			width,
			height
		};
	}, [width, height]);
	useEffect(() => {
		particlesRef.current = [];
	}, [clearTrigger]);
	useEffect(() => {
		particlesRef.current = [];
		spawnIndexRef.current = 0;
		spiralAngleRef.current = 0;
	}, [resetTrigger]);
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const usingExternalMouse = mouseX !== void 0 && mouseY !== void 0;
		const handleMouseMove = (e) => {
			if (usingExternalMouse) return;
			const rect = canvas.getBoundingClientRect();
			let x = e.clientX - rect.left;
			let y = e.clientY - rect.top;
			if (mouseTransform) {
				const transformed = mouseTransform(x, y);
				x = transformed.x;
				y = transformed.y;
			}
			mouseRef.current = {
				x,
				y
			};
		};
		const handleMouseLeave = () => {
			if (usingExternalMouse) return;
			mouseRef.current = {
				x: -1e3,
				y: -1e3
			};
		};
		if (!usingExternalMouse) {
			canvas.addEventListener("mousemove", handleMouseMove);
			canvas.addEventListener("mouseleave", handleMouseLeave);
		}
		let animationId;
		const dailyContributions = data.rawContributions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		const effectiveSpeed = speed * .5;
		function spawnParticlesForDay() {
			if (showAllDays) {
				if (spawnIndexRef.current >= dailyContributions.length) spawnIndexRef.current = 0;
				const day = dailyContributions[spawnIndexRef.current];
				const commitCount = day.contributionCount;
				onDayChange?.({
					day: spawnIndexRef.current + 1,
					total: dailyContributions.length,
					date: day.date
				});
				spiralAngleRef.current += spiralClockwise ? .08 : -.08;
				if (commitCount > 0) {
					const particleCount = Math.min(Math.ceil(commitCount / 3), 5);
					for (let i = 0; i < particleCount; i++) {
						const random = createParticleRandom(day.date, spawnIndexRef.current, i);
						const colors = colorsRef.current;
						const colorSeed = (commitCount * 7 + spawnIndexRef.current * 13 + i * 3) % colors.length;
						const color = colors[colorSeed];
						const angleVariation = (random() - .5) * .15;
						const sizeFromCommits = (2 + Math.min(commitCount, 30) * .2) * particleScale;
						const sizeVariation = .7 + random() * .6;
						const ageOffset = Math.floor(random() * 10);
						particlesRef.current.push({
							baseAngle: spiralAngleRef.current + angleVariation,
							size: sizeFromCommits * sizeVariation,
							color,
							age: ageOffset,
							pathTime: ageOffset / 60,
							maxAge: lifetimeSeconds * 60,
							offsetX: 0,
							offsetY: 0,
							glowActivation: 0
						});
					}
				}
				spawnIndexRef.current++;
			} else {
				let attempts = 0;
				while (attempts < dailyContributions.length) {
					if (spawnIndexRef.current >= dailyContributions.length) spawnIndexRef.current = 0;
					const day = dailyContributions[spawnIndexRef.current];
					onDayChange?.({
						day: spawnIndexRef.current + 1,
						total: dailyContributions.length,
						date: day.date
					});
					spawnIndexRef.current++;
					if (day.contributionCount > 0) {
						const particleCount = Math.min(Math.ceil(day.contributionCount / 3), 5);
						const commitCount = day.contributionCount;
						for (let i = 0; i < particleCount; i++) {
							const random = createParticleRandom(day.date, spawnIndexRef.current, i);
							const colors = colorsRef.current;
							const colorSeed = (commitCount * 7 + spawnIndexRef.current * 13 + i * 3) % colors.length;
							const color = colors[colorSeed];
							const angleVariation = (random() - .5) * .15;
							const sizeFromCommits = (2 + Math.min(commitCount, 30) * .2) * particleScale;
							const sizeVariation = .7 + random() * .6;
							const ageOffset = Math.floor(random() * 10);
							particlesRef.current.push({
								baseAngle: spiralAngleRef.current + angleVariation,
								size: sizeFromCommits * sizeVariation,
								color,
								age: ageOffset,
								pathTime: ageOffset / 60,
								maxAge: lifetimeSeconds * 60,
								offsetX: 0,
								offsetY: 0,
								glowActivation: 0
							});
						}
						spiralAngleRef.current += spiralClockwise ? .08 : -.08;
						return;
					}
					attempts++;
				}
			}
		}
		function animate() {
			if (!ctx || !canvas) return;
			const { width: currentWidth, height: currentHeight } = sizeRef.current;
			const centerX = currentWidth / 2;
			const centerY = currentHeight / 2;
			const maxDistance = Math.min(currentWidth, currentHeight) * maxRadius * .5;
			ctx.clearRect(0, 0, currentWidth, currentHeight);
			if (!paused) {
				frameCountRef.current++;
				const spawnInterval = Math.max(1, Math.floor(30 / spawnRate));
				if (frameCountRef.current % spawnInterval === 0) spawnParticlesForDay();
			}
			const particles = particlesRef.current;
			const mouse = mouseX !== void 0 && mouseY !== void 0 ? {
				x: mouseX,
				y: mouseY
			} : mouseRef.current;
			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				if (!paused) {
					p.age += effectiveSpeed;
					const deltaTime = effectiveSpeed / 60;
					p.pathTime += deltaTime * (spiralClockwise ? 1 : -1);
				}
				const timeSeconds = p.age / 60;
				const maxScaledTime = lifetimeSeconds;
				const ageFade = 1 - timeSeconds / maxScaledTime;
				if (!paused && (ageFade <= 0 || timeSeconds > maxScaledTime)) {
					particles.splice(i, 1);
					continue;
				}
				const radiusPhase = timeSeconds * spiralExpansion;
				const rawProgress = Math.sin(radiusPhase * Math.PI) + spiralCenterOffset;
				const radiusProgress = 2 / (1 + Math.exp(-rawProgress * 1.3)) - 1;
				const radius = 20 + radiusProgress * (maxDistance - 20);
				const angle = p.baseAngle + p.pathTime * spiralTurnRate;
				const baseX = centerX + Math.cos(angle) * radius;
				const baseY = centerY + Math.sin(angle) * radius;
				const dxMouse = baseX + p.offsetX - mouse.x;
				const dyMouse = baseY + p.offsetY - mouse.y;
				const distToMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
				if (!paused) {
					if (mouseEffects.mouseRepel && distToMouse < mouseEffects.repelRadius && distToMouse > 0) {
						const repelForce = (1 - distToMouse / mouseEffects.repelRadius) * mouseEffects.repelStrength * 2;
						p.offsetX += dxMouse / distToMouse * repelForce;
						p.offsetY += dyMouse / distToMouse * repelForce;
					}
					if (mouseEffects.mouseAttract && distToMouse < mouseEffects.attractRadius && distToMouse > 0) {
						const attractForce = (1 - distToMouse / mouseEffects.attractRadius) * mouseEffects.attractStrength * 1.25;
						p.offsetX -= dxMouse / distToMouse * attractForce;
						p.offsetY -= dyMouse / distToMouse * attractForce;
					}
					p.offsetX *= .95;
					p.offsetY *= .95;
				}
				const x = baseX + p.offsetX;
				const y = baseY + p.offsetY;
				const finalDxMouse = x - mouse.x;
				const finalDyMouse = y - mouse.y;
				const finalDistToMouse = Math.sqrt(finalDxMouse * finalDxMouse + finalDyMouse * finalDyMouse);
				let renderSize = p.size;
				if (mouseEffects.sizeOnHover && finalDistToMouse < mouseEffects.sizeRadius) {
					const sizeFactor = 1 - finalDistToMouse / mouseEffects.sizeRadius;
					renderSize = p.size * (1 + (mouseEffects.sizeMultiplier - 1) * sizeFactor);
				}
				let luminanceMultiplier = 1;
				if (mouseEffects.luminanceBoost && finalDistToMouse < mouseEffects.luminanceRadius) {
					const lumFactor = 1 - finalDistToMouse / mouseEffects.luminanceRadius;
					luminanceMultiplier = 1 + mouseEffects.luminanceAmount * lumFactor;
				}
				const fadeIn = fadeInDuration > 0 ? Math.min(1, timeSeconds / fadeInDuration) : 1;
				const alpha = ageFade * fadeIn * Math.min(luminanceMultiplier, 1);
				if (mouseEffects.hoverGlow) {
					const inGlowRadius = finalDistToMouse < mouseEffects.glowRadius;
					if (inGlowRadius && !paused) p.glowActivation = Math.min(1, p.glowActivation + .035);
					else if (!paused) p.glowActivation = Math.max(0, p.glowActivation - .015);
				}
				if (mouseEffects.hoverGlow && p.glowActivation > 0) {
					const distanceFactor = Math.max(0, 1 - finalDistToMouse / mouseEffects.glowRadius);
					const glowFactor = distanceFactor * distanceFactor;
					const easedActivation = 1 - Math.pow(1 - p.glowActivation, 3);
					const glowAlpha = glowFactor * easedActivation * mouseEffects.glowIntensity * ageFade;
					ctx.beginPath();
					ctx.arc(x, y, renderSize * 4, 0, Math.PI * 2);
					ctx.fillStyle = p.color + Math.floor(glowAlpha * .2 * 255).toString(16).padStart(2, "0");
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, renderSize * 2.5, 0, Math.PI * 2);
					ctx.fillStyle = p.color + Math.floor(glowAlpha * .4 * 255).toString(16).padStart(2, "0");
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, renderSize * 1.5, 0, Math.PI * 2);
					ctx.fillStyle = p.color + Math.floor(glowAlpha * .6 * 255).toString(16).padStart(2, "0");
					ctx.fill();
				}
				if (particleGlow > 0) {
					const glowAlpha = alpha * particleGlow * .4;
					ctx.beginPath();
					ctx.arc(x, y, renderSize * 3, 0, Math.PI * 2);
					ctx.fillStyle = p.color + Math.floor(glowAlpha * .3 * 255).toString(16).padStart(2, "0");
					ctx.fill();
					ctx.beginPath();
					ctx.arc(x, y, renderSize * 1.8, 0, Math.PI * 2);
					ctx.fillStyle = p.color + Math.floor(glowAlpha * .6 * 255).toString(16).padStart(2, "0");
					ctx.fill();
				}
				ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
				ctx.beginPath();
				ctx.arc(x, y, renderSize, 0, Math.PI * 2);
				ctx.fill();
				if (mouseEffects.luminanceBoost && finalDistToMouse < mouseEffects.luminanceRadius) {
					const lumFactor = 1 - finalDistToMouse / mouseEffects.luminanceRadius;
					const coreAlpha = lumFactor * mouseEffects.luminanceAmount * ageFade * .5;
					ctx.beginPath();
					ctx.arc(x, y, renderSize * .5, 0, Math.PI * 2);
					ctx.fillStyle = "#ffffff" + Math.floor(coreAlpha * 255).toString(16).padStart(2, "0");
					ctx.fill();
				}
			}
			animationId = requestAnimationFrame(animate);
		}
		animate();
		return () => {
			if (animationId) cancelAnimationFrame(animationId);
			if (!usingExternalMouse) {
				canvas.removeEventListener("mousemove", handleMouseMove);
				canvas.removeEventListener("mouseleave", handleMouseLeave);
			}
		};
	}, [
		data,
		width,
		height,
		palette,
		speed,
		spawnRate,
		lifetimeSeconds,
		maxRadius,
		initialSpeed,
		acceleration,
		deceleration,
		mouseEffects,
		spiralTurnRate,
		spiralExpansion,
		spiralClockwise,
		spiralCenterOffset,
		paused,
		particleGlow,
		particleScale,
		showAllDays,
		mouseX,
		mouseY,
		mouseTransform
	]);
	return /* @__PURE__ */ jsx(
		"canvas",
		// starting angle on spiral
		// for fade/death timing (always increases)
		// for position calculation (can go +/- based on direction)
		// position offset from mouse effects
		// 0-1, how activated the glow effect is (for smooth transitions)
		// start pathTime synced with age offset
		// start pathTime synced with age offset
		// Quadratic falloff
		{
			ref: canvasRef,
			width,
			height,
			style: { background: "transparent" }
		}
);
}));

//#endregion
//#region src/components/GitMosaic.tsx
const GitMosaic = forwardRef(function GitMosaic$1({ username, data, dataUrl, variant = DEFAULTS.variant, width = DEFAULTS.width, height = DEFAULTS.height, colorScheme = DEFAULTS.colorScheme, customColors, className = "", animated = DEFAULTS.animated, speed = DEFAULTS.speed, particleCount = DEFAULTS.particleCount, lifetimeSeconds = DEFAULTS.lifetimeSeconds, maxRadius = DEFAULTS.maxRadius, initialSpeed = DEFAULTS.initialSpeed, acceleration = DEFAULTS.acceleration, deceleration = DEFAULTS.deceleration, spawnRate = DEFAULTS.spawnRate, particleGlow = DEFAULTS.particleGlow, particleScale = DEFAULTS.particleScale, fadeInDuration = DEFAULTS.fadeInDuration, interactive = DEFAULTS.interactive, hoverGlow = DEFAULTS.hoverGlow, glowRadius = DEFAULTS.glowRadius, glowIntensity = DEFAULTS.glowIntensity, mouseRepel = DEFAULTS.mouseRepel, repelRadius = DEFAULTS.repelRadius, repelStrength = DEFAULTS.repelStrength, mouseAttract = DEFAULTS.mouseAttract, attractRadius = DEFAULTS.attractRadius, attractStrength = DEFAULTS.attractStrength, luminanceBoost = DEFAULTS.luminanceBoost, luminanceRadius = DEFAULTS.luminanceRadius, luminanceAmount = DEFAULTS.luminanceAmount, sizeOnHover = DEFAULTS.sizeOnHover, sizeRadius = DEFAULTS.sizeRadius, sizeMultiplier = DEFAULTS.sizeMultiplier, mouseX, mouseY, mouseTransform, spiralTurnRate = DEFAULTS.spiralTurnRate, spiralExpansion = DEFAULTS.spiralExpansion, spiralClockwise = DEFAULTS.spiralClockwise, spiralCenterOffset = DEFAULTS.spiralCenterOffset, bloomVelocity = DEFAULTS.bloomVelocity, bloomSpread = DEFAULTS.bloomSpread, ringsWobble = DEFAULTS.ringsWobble, ringsArcLength = DEFAULTS.ringsArcLength, ringsClockwise = DEFAULTS.ringsClockwise, clearTrigger = 0, resetTrigger = 0, onDayChange, paused = false, showAllDays = false }, ref) {
	const { data: gitData, error } = useGitData(username, data, dataUrl);
	const palette = customColors || getColorScheme(colorScheme);
	const mouseEffects = useMemo(() => ({
		hoverGlow,
		glowRadius,
		glowIntensity,
		mouseRepel,
		repelRadius,
		repelStrength,
		mouseAttract,
		attractRadius,
		attractStrength,
		luminanceBoost,
		luminanceRadius,
		luminanceAmount,
		sizeOnHover,
		sizeRadius,
		sizeMultiplier
	}), [
		hoverGlow,
		glowRadius,
		glowIntensity,
		mouseRepel,
		repelRadius,
		repelStrength,
		mouseAttract,
		attractRadius,
		attractStrength,
		luminanceBoost,
		luminanceRadius,
		luminanceAmount,
		sizeOnHover,
		sizeRadius,
		sizeMultiplier
	]);
	if (error || !gitData) return /* @__PURE__ */ jsx("div", {
		className,
		style: {
			width,
			height
		}
	});
	const renderVariant = () => {
		switch (variant) {
			case "daily-bloom": return /* @__PURE__ */ jsx(DailyBloom, {
				data: gitData,
				width,
				height,
				palette,
				speed: animated ? speed * 2 : 0,
				spawnRate,
				particleCount,
				lifetimeSeconds,
				maxRadius,
				initialSpeed,
				acceleration,
				deceleration,
				interactive,
				mouseEffects,
				clearTrigger,
				resetTrigger,
				onDayChange,
				bloomVelocity,
				bloomSpread,
				paused,
				particleGlow,
				particleScale,
				fadeInDuration,
				showAllDays,
				mouseX,
				mouseY,
				mouseTransform
			});
			case "daily-rings": return /* @__PURE__ */ jsx(DailyRings, {
				data: gitData,
				width,
				height,
				palette,
				speed: animated ? speed : 0,
				spawnRate,
				particleCount,
				lifetimeSeconds,
				maxRadius,
				initialSpeed,
				acceleration,
				deceleration,
				interactive,
				mouseEffects,
				clearTrigger,
				resetTrigger,
				onDayChange,
				ringsWobble,
				ringsArcLength,
				ringsClockwise,
				paused,
				particleGlow,
				fadeInDuration,
				showAllDays,
				mouseX,
				mouseY,
				mouseTransform
			});
			case "daily-spiral": return /* @__PURE__ */ jsx(DailySpiral, {
				ref,
				data: gitData,
				width,
				height,
				palette,
				speed: animated ? speed * .5 : 0,
				spawnRate,
				particleCount,
				lifetimeSeconds,
				maxRadius,
				initialSpeed,
				acceleration,
				deceleration,
				interactive,
				mouseEffects,
				clearTrigger,
				resetTrigger,
				onDayChange,
				spiralTurnRate,
				spiralExpansion,
				spiralClockwise,
				spiralCenterOffset,
				paused,
				particleGlow,
				particleScale,
				fadeInDuration,
				showAllDays,
				mouseX,
				mouseY,
				mouseTransform
			});
			default: return /* @__PURE__ */ jsxs("div", { children: ["Unknown variant: ", variant] });
		}
	};
	return /* @__PURE__ */ jsx("div", {
		className,
		style: {
			width,
			height,
			overflow: "hidden"
		},
		children: renderVariant()
	});
});

//#endregion
export { GitMosaic, colorSchemes };
//# sourceMappingURL=index.js.map