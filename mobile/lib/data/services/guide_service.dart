import '../../core/constants/api_config.dart';
import '../../core/network/api_client.dart';
import '../models/guide_schedule_model.dart';

class GuideService {
  GuideService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient();

  final ApiClient _api;

  Future<({GuideInfoModel guide, List<GuideScheduleItemModel> schedules})>
  fetchMySchedule() async {
    final response = await _api.getJson(ApiConfig.guideMySchedule);
    if (response is! Map<String, dynamic>) {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Máy chủ chưa trả về dữ liệu lịch dẫn đoàn hợp lệ.',
      );
    }

    final hdvData = response['hdv'] as Map<String, dynamic>? ?? {};
    final guide = GuideInfoModel.fromJson(hdvData);

    final lichRaw = response['lich'] as List<dynamic>? ?? const [];
    final schedules = lichRaw
        .whereType<Map<String, dynamic>>()
        .map(GuideScheduleItemModel.fromJson)
        .toList();

    return (guide: guide, schedules: schedules);
  }

  Future<void> respondAssignment(int dispatchId, String status) async {
    await _api.patchJson(
      ApiConfig.assignmentRespond(dispatchId),
      body: {'TrangThai': status},
    );
  }

  Future<void> togglePaxCheckin(int paxId) async {
    await _api.patchJson(
      ApiConfig.guideCheckinToggle(paxId),
      body: const {},
    );
  }

  Future<Map<String, dynamic>> checkinByQr(String code, {int? lichId}) async {
    final body = <String, dynamic>{'code': code};
    if (lichId != null) body['lichId'] = lichId;

    final response = await _api.postJson(
      ApiConfig.guideCheckinQr,
      body: body,
    );
    if (response is Map<String, dynamic>) {
      return response;
    }
    return {'message': 'Điểm danh thành công'};
  }
}

